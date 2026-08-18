import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="npm:@types/nodemailer"
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const functionVersion = "invite-user-smtp-v2";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseRoleId(roleId: unknown) {
  if (roleId === null || roleId === undefined || roleId === "") return null;
  const parsed = Number(roleId);
  return Number.isFinite(parsed) ? parsed : null;
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Invite function is missing ${name}`);
  return value;
}

serve(async (req) => {
  console.log(`${functionVersion}: request received`);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Invite function is missing Supabase admin environment variables", version: functionVersion }, 500);
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey
    );

    const { email, display_name, role_id, redirect_to } = await req.json();

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedDisplayName = display_name ? String(display_name).trim() : null;
    const normalizedRoleId = parseRoleId(role_id);

    if (!normalizedEmail) {
      return json({ error: "Email is required", version: functionVersion }, 400);
    }

    // Check if user already exists in user_role_assignments
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("user_role_assignments")
      .select("id, user_id, email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing) {
      // Update existing record and un-delete if soft-deleted
      const { error: updateError } = await supabaseAdmin
        .from("user_role_assignments")
        .update({
          display_name: normalizedDisplayName || existing.display_name,
          role_id: normalizedRoleId,
          deleted_at: null,
          deleted_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (updateError) throw updateError;
    } else {
      // Create pre-provisioned user assignment
      const { error: insertError } = await supabaseAdmin
        .from("user_role_assignments")
        .insert({
          email: normalizedEmail,
          display_name: normalizedDisplayName,
          role_id: normalizedRoleId,
        });
      if (insertError) throw insertError;
    }

    let linkData: any = null;
    let linkError: any = null;

    const generateInvite = await supabaseAdmin.auth.admin.generateLink({
      type: "invite",
      email: normalizedEmail,
      options: {
        redirectTo: redirect_to || `${new URL(req.url).origin}/reset-password`,
        data: {
          display_name: normalizedDisplayName || normalizedEmail.split("@")[0],
        },
      },
    });

    if (generateInvite.error || !generateInvite.data?.properties?.action_link) {
      // User may already exist in Auth; generate a recovery link so they can access their account
      const generateRecovery = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: normalizedEmail,
        options: {
          redirectTo: redirect_to || `${new URL(req.url).origin}/reset-password`,
        },
      });
      linkData = generateRecovery.data;
      linkError = generateRecovery.error;
    } else {
      linkData = generateInvite.data;
    }

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Invite link error:", linkError || generateInvite.error);
      return json({ error: linkError?.message || generateInvite.error?.message || "Failed to generate invite link", version: functionVersion }, 500);
    }

    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    let emailSent = false;
    let emailError: string | null = null;

    if (smtpUser && smtpPass) {
      try {
        const inviteLink = linkData.properties.action_link;
        const name = normalizedDisplayName || normalizedEmail.split("@")[0];
        const transporter = nodemailer.createTransport({
          host: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
          port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
          secure: Deno.env.get("SMTP_SECURE") === "true",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        await transporter.sendMail({
          from: Deno.env.get("EMAIL_FROM") || smtpUser,
          to: normalizedEmail,
          subject: "You're invited to HRM_OPS - Set up your account",
          html: `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#253C7D;padding:30px;border-radius:12px 12px 0 0;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">Welcome to HRM_OPS</h1>
  </div>
  <div style="background:#f8fafc;padding:30px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
    <p style="font-size:16px;margin-top:0">Hello <strong>${name}</strong>,</p>
    <p style="font-size:16px">You've been invited to join <strong>HRM_OPS</strong>. Click the button below to set up your account and create your password.</p>
    <div style="text-align:center;margin:30px 0">
      <a href="${inviteLink}" style="display:inline-block;background:#253C7D;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Set Up Account</a>
    </div>
    <p style="font-size:14px;color:#64748b">Or copy this link to your browser:</p>
    <p style="font-size:12px;color:#94a3b8;word-break:break-all;background:#f1f5f9;padding:12px;border-radius:6px">${inviteLink}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0">
    <p style="font-size:12px;color:#94a3b8;margin:0">This link expires in 24 hours. If you didn't expect this, ignore this email.</p>
  </div>
</body>
</html>`,
        });
        emailSent = true;
      } catch (err: any) {
        console.error("SMTP send error:", err);
        emailError = err.message || "Failed to send email via SMTP";
      }
    } else {
      try {
        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(normalizedEmail, {
          redirectTo: redirect_to || `${new URL(req.url).origin}/auth/reset-password`,
          data: {
            display_name: normalizedDisplayName || normalizedEmail.split("@")[0],
          },
        });
        if (!inviteError) {
          emailSent = true;
        } else {
          emailError = inviteError.message;
        }
      } catch (err: any) {
        emailError = err.message;
      }
    }

    return json({
      success: true,
      message: emailSent ? "Invitation sent successfully" : "User invited successfully",
      invite_link: linkData.properties.action_link,
      email_sent: emailSent,
      email_error: emailError,
      version: functionVersion,
      user: linkData.user,
    });
  } catch (err: any) {
    console.error("Function error:", err);
    return json({ error: err.message || "Internal server error", version: functionVersion }, 500);
  }
});
