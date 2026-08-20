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
    subject: "Password reset approved",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>Password reset approved</h2>
        <p>An administrator approved your request to reset your HR System password.</p>
        <p><a href="${resetLink}" style="display:inline-block;background:#253C7D;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700;">Set new password</a></p>
        <p style="font-size:12px;color:#6b7280;">If the button does not work, copy and paste this link into your browser:<br>${resetLink}</p>
      </div>
    `,
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
