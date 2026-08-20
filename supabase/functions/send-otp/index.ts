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

function generateOTP(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b % 10).join("");
}

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const OTP_EXPIRY_MINUTES = 5;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    // SMTP config (same as invite-user)
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS")?.replace(/\s+/g, "");
    const emailFrom = Deno.env.get("EMAIL_FROM") || `HRSystem <${smtpUser}>`;

    if (!smtpUser || !smtpPass) {
      console.error("SMTP credentials not configured");
      return json({ error: "Email service not configured" }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const email: string = body?.email;

    if (!email || typeof email !== "string") {
      return json({ error: "Email is required" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up user by email via GoTrue admin API
    const userRes = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(normalizedEmail)}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      }
    );

    const userList = await userRes.json();
    const user = userList?.users?.[0];

    if (!user) {
      return json({ error: "No account found with this email" }, 404);
    }

    // Delete any existing unverified OTPs for this email
    await admin.from("email_otps").delete().eq("email", normalizedEmail).eq("verified", false);

    // Generate and hash OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Store OTP in database
    const { error: insertError } = await admin.from("email_otps").insert({
      user_id: user.id,
      email: normalizedEmail,
      otp_hash: otpHash,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Insert OTP error:", insertError);
      return json({ error: "Failed to generate OTP" }, 500);
    }

    // Clean up expired OTPs as side effect
    await admin.rpc("cleanup_expired_otps");

    // Build email HTML
    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Verification Code</h1>
  </div>
  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Hello,</p>
    <p style="font-size: 16px;">Use the following code to complete your sign-in:</p>
    <div style="text-align: center; margin: 30px 0;">
      <span style="display: inline-block; background: #f1f5f9; border: 2px dashed #253C7D; border-radius: 12px; padding: 16px 32px; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #253C7D; font-family: 'SF Mono', 'Fira Code', monospace;">${otp}</span>
    </div>
    <p style="font-size: 14px; color: #64748b; text-align: center;">This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0;">If you didn't request this code, please ignore this email.</p>
    <p style="font-size: 12px; color: #94a3b8; margin: 8px 0 0;">— The HR System Team</p>
  </div>
</body>
</html>`;

    // Send via Gmail SMTP using nodemailer
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
      to: normalizedEmail,
      subject: "Your Verification Code — HR System",
      html: emailHtml,
    });

    return json({ success: true, message: "OTP sent successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Send OTP error:", err);
    return json({ error: message }, 500);
  }
});
