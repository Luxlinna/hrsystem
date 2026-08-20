// @deno-types="npm:@types/nodemailer"
import nodemailer from "npm:nodemailer@6";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

async function sendEmail(to: string, resetLink: string) {
  const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
  const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
  const smtpUser = Deno.env.get("SMTP_USER");
  const smtpPass = Deno.env.get("SMTP_PASS")?.replace(/\s+/g, "");
  const emailFrom = Deno.env.get("EMAIL_FROM") || `HRSystem <${smtpUser}>`;

  if (!smtpUser || !smtpPass) throw new Error("SMTP credentials not configured");

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: Deno.env.get("SMTP_SECURE") === "true",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transporter.sendMail({
    from: emailFrom,
    to,
    subject: "Password Reset Approved — HR System",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Password Reset Approved</h1>
  </div>
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Hello,</p>
    <p style="font-size: 15px; color: #475569;">An administrator has approved your request to reset your HR System password. Click the button below to set a new password:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" style="display:inline-block;background:#253C7D;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">Set New Password</a>
    </div>
    <p style="font-size: 13px; color: #94a3b8; text-align: center;">This link will expire in 1 hour for security purposes.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">If you didn't request this, please ignore this email or contact your administrator.</p>
    <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0;">— The HR System Team</p>
  </div>
</body>
</html>`,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData.user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: assignment } = await admin
      .from("user_role_assignments")
      .select("app_roles(is_admin, allowed_modules)")
      .eq("user_id", authData.user.id)
      .is("deleted_at", null)
      .maybeSingle();
    const role = Array.isArray((assignment as any)?.app_roles) ? (assignment as any).app_roles[0] : (assignment as any)?.app_roles;
    const canApprove = role?.is_admin || role?.allowed_modules?.includes("*") || role?.allowed_modules?.includes("settings");
    if (!canApprove) return json({ error: "Not authorized to approve password resets" }, 403);

    const { request_id, action, note, redirect_to } = await req.json();
    if (!request_id || !["approve", "reject"].includes(action)) {
      return json({ error: "Invalid request" }, 400);
    }

    const { data: resetRequest, error: requestError } = await admin
      .from("password_reset_requests")
      .select("*")
      .eq("id", request_id)
      .eq("status", "pending")
      .maybeSingle();
    if (requestError) return json({ error: requestError.message }, 500);
    if (!resetRequest) return json({ error: "Request is no longer pending" }, 400);

    if (action === "reject") {
      await admin
        .from("password_reset_requests")
        .update({ status: "rejected", acted_at: new Date().toISOString(), acted_by: authData.user.id, admin_note: note || null })
        .eq("id", request_id);
      await admin.from("notifications").update({ is_read: true }).eq("source", "password_reset").eq("entity_id", request_id);
      return json({ success: true });
    }

    const appUrl = String(redirect_to || Deno.env.get("APP_URL") || Deno.env.get("VITE_APP_URL") || "").replace(/\/reset-password\/?$/, "").replace(/\/$/, "");
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "recovery",
      email: resetRequest.email,
      options: { redirectTo: `${appUrl}/reset-password` },
    });
    if (linkError || !linkData?.properties?.action_link) {
      return json({ error: linkError?.message || "Could not generate reset link" }, 500);
    }

    await sendEmail(resetRequest.email, linkData.properties.action_link);
    await admin
      .from("password_reset_requests")
      .update({
        status: "approved",
        acted_at: new Date().toISOString(),
        acted_by: authData.user.id,
        admin_note: note || null,
        reset_link_sent_at: new Date().toISOString(),
      })
      .eq("id", request_id);
    await admin.from("notifications").update({ is_read: true }).eq("source", "password_reset").eq("entity_id", request_id);

    return json({ success: true });
  } catch (err: any) {
    console.error("approve-password-reset error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
