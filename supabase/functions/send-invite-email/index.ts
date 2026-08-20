import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, display_name, role_id, redirect_to } = await req.json();

    if (!email) {
      return json({ error: "Email is required" }, 400);
    }

    // Check if user already exists in user_role_assignments
    const { data: existing } = await supabaseAdmin
      .from("user_role_assignments")
      .select("id, user_id, email")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      if (existing.user_id) {
        return json({ error: "User already has an account" }, 400);
      }
      // Update existing pre-provisioned record
      const { error: updateError } = await supabaseAdmin
        .from("user_role_assignments")
        .update({ display_name, role_id: role_id ? parseInt(role_id) : null })
        .eq("id", existing.id);
      if (updateError) throw updateError;
    } else {
      // Create pre-provisioned user assignment
      const { error: insertError } = await supabaseAdmin
        .from("user_role_assignments")
        .insert({
          email,
          display_name: display_name || null,
          role_id: role_id ? parseInt(role_id) : null,
        });
      if (insertError) throw insertError;
    }

    // Create the user in Supabase Auth (without sending Supabase's own email)
    let userData = null;
    let createUserError = null;

    try {
      const result = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: false,
        user_metadata: {
          display_name: display_name || email.split("@")[0],
        },
      });
      userData = result.data;
      createUserError = result.error;
    } catch (e: any) {
      createUserError = e;
    }

    let userId: string | null = null;

    if (createUserError) {
      const errMsg = createUserError.message || String(createUserError);
      if (errMsg.includes("already been registered") || errMsg.includes("already exists")) {
        // Retrieve the existing user's ID by listing users
        const listResult = await supabaseAdmin.auth.admin.listUsers({
          perPage: 1000,
        });
        if (listResult.error) {
          console.error("List users error:", listResult.error);
          return json({ error: listResult.error.message }, 500);
        }
        const users = listResult.data?.users || [];
        const existingAuthUser = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (existingAuthUser) {
          userId = existingAuthUser.id;
        } else {
          return json({ error: "User is already registered but could not be retrieved from auth records." }, 500);
        }
      } else {
        console.error("Create user error:", createUserError);
        return json({ error: errMsg }, 500);
      }
    } else if (userData?.user) {
      userId = userData.user.id;
    }

    if (!userId) {
      return json({ error: "Failed to determine user ID" }, 500);
    }

    // Update/link the user_id in user_role_assignments immediately
    const { error: linkError } = await supabaseAdmin
      .from("user_role_assignments")
      .update({ user_id: userId })
      .eq("email", email);

    if (linkError) {
      console.error("Failed to link user_id in user_role_assignments:", linkError);
    }

    // Generate password reset link (user will set password via this link)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: redirect_to || `${new URL(req.url).origin}/auth/reset-password`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Generate link error:", linkError);
      return json({ error: "Failed to generate invite link" }, 500);
    }

    const inviteLink = linkData.properties.action_link;

    // SMTP config from environment variables (declared once)
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS")?.replace(/\s+/g, "");
    const emailFrom = Deno.env.get("EMAIL_FROM") || `HR System <${smtpUser}>`;

    if (!smtpUser || !smtpPass) {
      console.error("SMTP credentials not configured");
      return json({ error: "Email service not configured" }, 500);
    }

    // Create email content — link is only in the button href, not shown as visible text
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to HR System</h1>
  </div>
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Hello <strong>${display_name || email.split("@")[0]}</strong>,</p>
    <p style="font-size: 16px;">You have been invited to join <strong>HR System</strong>. Click the button below to set up your account and create your password.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteLink}" style="display: inline-block; background: #1e40af; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Set Up Account</a>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">This link expires in 24 hours. If you didn't expect this invitation, please ignore this email.</p>
    <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0;">— The HR System Team</p>
  </div>
</body>
</html>
    `.trim();

    // Create SMTP client
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Send email
    await transporter.sendMail({
      from: emailFrom,
      to: email,
      subject: "You're invited to HR System - Set up your account",
      text: "Please enable HTML to view this email.",
      html: emailHtml,
    });

    return json({
      success: true,
      message: "Invitation sent successfully via Gmail SMTP",
      user: userData.user,
    });
  } catch (err: any) {
    console.error("Function error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});