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

function getTransporter() {
  return nodemailer.createTransport({
    host: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
    port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
    secure: Deno.env.get("SMTP_SECURE") === "true",
    auth: {
      user: Deno.env.get("SMTP_USER"),
      pass: Deno.env.get("SMTP_PASS"),
    },
  });
}

function buildInviteEmail(name: string, inviteLink: string): string {
  return `
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
    <p style="font-size: 16px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
    <p style="font-size: 16px;">You have been invited to join <strong>HR System</strong>. Click the button below to set up your account and create your password.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteLink}" style="display: inline-block; background: #1e40af; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Set Up Account</a>
    </div>
    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
      <p style="font-size: 13px; color: #92400e; margin: 0;">
        ⏰ <strong>This link expires in 24 hours.</strong> If you don't set up your account before then, ask your administrator to resend the invitation.
      </p>
    </div>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
    <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0;">— The HR System Team</p>
  </div>
</body>
</html>`.trim();
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

    const { data: existing } = await supabaseAdmin
      .from("user_role_assignments")
      .select("id, user_id, email")
      .eq("email", email)
      .maybeSingle();

    // If a user_id is already linked, check whether they have actually confirmed
    // their account (i.e. set a password). If they have, block the invite.
    // If they haven't (invite expired / never clicked the link), allow a resend.
    if (existing?.user_id) {
      const { data: authUserData, error: authLookupError } =
        await supabaseAdmin.auth.admin.getUserById(existing.user_id);

      if (authLookupError) {
        console.error("Auth user lookup error:", authLookupError);
        return json({ error: "Could not verify account status" }, 500);
      }

      const isConfirmed =
        !!authUserData?.user?.email_confirmed_at ||
        !!authUserData?.user?.confirmed_at;

      if (isConfirmed) {
        return json({ error: "User already has an active account" }, 400);
      }

      // Unconfirmed — this is a resend for an expired invite. Update metadata
      // if supplied but keep the existing row and user_id intact.
      if (display_name || role_id) {
        await supabaseAdmin
          .from("user_role_assignments")
          .update({ display_name, role_id: role_id ? parseInt(role_id) : null })
          .eq("id", existing.id);
      }

      // Skip auth user creation; jump straight to generating a fresh link.
      const userId = existing.user_id;

      const defaultRedirectUrl = "https://hrsystem-quit.onrender.com/reset-password";
      const resolvedRedirectTo = (!redirect_to || redirect_to.includes("localhost") || redirect_to.includes("127.0.0.1") || redirect_to.includes("supabase.co"))
        ? defaultRedirectUrl
        : redirect_to;

      const { data: linkData, error: generateLinkError } =
        await supabaseAdmin.auth.admin.generateLink({
          type: "recovery",
          email,
          options: {
            redirectTo: resolvedRedirectTo,
          },
        });

      if (generateLinkError || !linkData?.properties?.action_link) {
        console.error("Generate link error:", generateLinkError);
        return json({ error: "Failed to generate invite link" }, 500);
      }

      const inviteLink = linkData.properties.action_link;
      const resolvedName = display_name || authUserData?.user?.user_metadata?.display_name || email.split("@")[0];

      const emailHtml = buildInviteEmail(resolvedName, inviteLink);

      let emailSent = false;
      let emailError: string | null = null;
      try {
        const transporter = getTransporter();
        await transporter.sendMail({
          from: Deno.env.get("EMAIL_FROM") || "HRSystem <hrmsystem.ops@gmail.com>",
          to: email,
          subject: "Your HR System invitation — new setup link",
          html: emailHtml,
        });
        emailSent = true;
      } catch (mailErr: any) {
        console.error("SMTP send failed:", mailErr);
        emailError = mailErr.message || String(mailErr);
      }

      if (!emailSent) {
        return json({
          success: false,
          error: "Invite link regenerated but the email failed to send",
          email_error: emailError,
          user_id: userId,
        }, 500);
      }

      return json({
        success: true,
        message: "Invitation resent successfully",
        user: { id: userId, email },
      });
    }

    if (existing) {
      // Row exists but no user_id yet — update metadata if supplied.
      const { error: updateError } = await supabaseAdmin
        .from("user_role_assignments")
        .update({ display_name, role_id: role_id ? parseInt(role_id) : null })
        .eq("id", existing.id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("user_role_assignments")
        .insert({
          email,
          display_name: display_name || null,
          role_id: role_id ? parseInt(role_id) : null,
        });
      if (insertError) throw insertError;
    }

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
        const listResult = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
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

    const { error: linkError } = await supabaseAdmin
      .from("user_role_assignments")
      .update({ user_id: userId })
      .eq("email", email);

    if (linkError) {
      console.error("Failed to link user_id in user_role_assignments:", linkError);
    }

    const defaultRedirectUrl = "https://hrsystem-quit.onrender.com/reset-password";
    const resolvedRedirectTo = (!redirect_to || redirect_to.includes("localhost") || redirect_to.includes("127.0.0.1") || redirect_to.includes("supabase.co"))
      ? defaultRedirectUrl
      : redirect_to;

    const { data: linkData, error: generateLinkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: resolvedRedirectTo,
      },
    });

    if (generateLinkError || !linkData?.properties?.action_link) {
      console.error("Generate link error:", generateLinkError);
      return json({ error: "Failed to generate invite link" }, 500);
    }

    const inviteLink = linkData.properties.action_link;
    const emailHtml = buildInviteEmail(display_name || email.split("@")[0], inviteLink);

    let emailSent = false;
    let emailError: string | null = null;

    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: Deno.env.get("EMAIL_FROM") || "HRSystem <hrmsystem.ops@gmail.com>",
        to: email,
        subject: "You're invited to HR System — Set up your account (link valid 24 hrs)",
        html: emailHtml,
      });
      emailSent = true;
    } catch (mailErr: any) {
      console.error("SMTP send failed:", mailErr);
      emailError = mailErr.message || String(mailErr);
    }

    if (!emailSent) {
      return json({
        success: false,
        error: "User was created but the invitation email failed to send",
        email_error: emailError,
        user_id: userId,
      }, 500);
    }

    return json({
      success: true,
      message: "Invitation sent successfully",
      user: userData?.user ?? { id: userId, email },
    });
  } catch (err: any) {
    console.error("Function error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
