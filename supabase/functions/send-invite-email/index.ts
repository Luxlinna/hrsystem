import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// @deno-types="npm:@types/nodemailer"
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email, display_name, role_id, redirect_to } = await req.json();
    if (!email) return json({ error: "Email is required" }, 400);

    // Upsert user_role_assignments row
    const { data: existing } = await supabaseAdmin
      .from("user_role_assignments")
      .select("id, user_id")
      .eq("email", email)
      .maybeSingle();

    if (existing?.user_id) return json({ error: "User already has an account" }, 400);

    if (existing) {
      await supabaseAdmin
        .from("user_role_assignments")
        .update({ display_name, role_id: role_id ? parseInt(role_id) : null })
        .eq("id", existing.id);
    } else {
      await supabaseAdmin.from("user_role_assignments").insert({
        email,
        display_name: display_name || null,
        role_id: role_id ? parseInt(role_id) : null,
      });
    }

    // Create auth user
    const { data: userData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: { display_name: display_name || email.split("@")[0] },
    });
    if (createUserError) return json({ error: createUserError.message }, 500);

    // Generate password reset / setup link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: redirect_to || "http://localhost:5173/reset-password",
      },
    });
    if (linkError || !linkData?.properties?.action_link) {
      return json({ error: "Failed to generate invite link" }, 500);
    }

    const inviteLink = linkData.properties.action_link;
    const name = display_name || email.split("@")[0];

    // Send via Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: Deno.env.get("SMTP_HOST") || "smtp.gmail.com",
      port: parseInt(Deno.env.get("SMTP_PORT") || "587"),
      secure: Deno.env.get("SMTP_SECURE") === "true",
      auth: {
        user: Deno.env.get("SMTP_USER"),
        pass: Deno.env.get("SMTP_PASS"),
      },
    });

    await transporter.sendMail({
      from: Deno.env.get("EMAIL_FROM") || Deno.env.get("SMTP_USER"),
      to: email,
      subject: "You're invited to HRM_OPS — Set up your account",
      html: `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:linear-gradient(135deg,#253C7D,#3b5fc0);padding:30px;border-radius:12px 12px 0 0;text-align:center">
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

    return json({ success: true, message: "Invitation sent successfully", user: userData.user });
  } catch (err: any) {
    console.error("Function error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
