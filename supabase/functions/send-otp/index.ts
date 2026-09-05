import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHONE_EMAIL_DOMAIN = "@phone.hrmsystem.local";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("855") && digits.length >= 11) {
    digits = "0" + digits.slice(3);
  }
  return digits;
}

function toE164(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("855")) {
    return `+${digits}`;
  }
  if (digits.startsWith("0")) {
    return `+855${digits.slice(1)}`;
  }
  if (phone.trim().startsWith("+")) {
    return `+${digits}`;
  }
  return `+855${digits}`;
}

function isPhoneSyntheticEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(PHONE_EMAIL_DOMAIN);
}

function syntheticEmailToPhone(email?: string | null): string {
  if (!email || !isPhoneSyntheticEmail(email)) return email || "";
  return email.slice(0, -PHONE_EMAIL_DOMAIN.length);
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const rawIdentifier: string = (body?.email || body?.identifier || "").trim();

    if (!rawIdentifier) {
      return json({ error: "Email or phone number is required" }, 400);
    }

    const isPhone = isPhoneSyntheticEmail(rawIdentifier) || !rawIdentifier.includes("@");
    const normalizedEmail = isPhone
      ? (isPhoneSyntheticEmail(rawIdentifier)
          ? rawIdentifier.toLowerCase()
          : `${normalizePhone(rawIdentifier)}${PHONE_EMAIL_DOMAIN}`)
      : rawIdentifier.toLowerCase();

    // Look up user in auth.users by normalized synthetic email / regular email
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
      return json({
        error: isPhone ? "No account found with this phone number" : "No account found with this email",
      }, 404);
    }

    // Clear existing unverified OTPs for this identifier
    await admin.from("email_otps").delete().eq("email", normalizedEmail).eq("verified", false);

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

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

    await admin.rpc("cleanup_expired_otps");

    if (isPhone) {
      const cleanPhone = syntheticEmailToPhone(normalizedEmail);
      const e164Phone = toE164(cleanPhone);
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";

      // 1. Check if user already connected their Telegram
      let chatId = user.user_metadata?.telegram_chat_id;

      // Also check fallback in system_settings
      if (!chatId) {
        const phoneVariants = [
          `tg_chat_${cleanPhone}`,
          `tg_chat_0${cleanPhone}`,
          `tg_chat_${cleanPhone.replace(/^0+/, "")}`,
        ];
        const { data: settings } = await admin
          .from("system_settings")
          .select("key, value")
          .in("key", phoneVariants)
          .limit(1);

        if (settings && settings.length > 0 && settings[0].value) {
          chatId = settings[0].value;
          // Backfill user_metadata
          await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...user.user_metadata,
              telegram_chat_id: String(chatId),
            },
          });
        }
      }

      // 2. If Telegram is connected, dispatch OTP via Telegram Bot (100% Free)
      if (chatId && botToken) {
        const botRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🔐 <b>HRM_OPS Sign-In Code</b>\n\nYour verification code is: <code>${otp}</code>\n\n⏱ This code expires in ${OTP_EXPIRY_MINUTES} minutes.\n⚠️ Do not share this code with anyone.`,
            parse_mode: "HTML",
          }),
        });

        const botData = await botRes.json();
        if (botData.ok) {
          return json({
            success: true,
            channel: "telegram_bot",
            phone: e164Phone,
            message: "Verification code sent to your Telegram (@HRM_OPS_bot)",
          });
        }
        console.error("Telegram bot sendMessage failed:", botData);
      }

      // 3. Optional fallback to Telegram Gateway if configured and has balance
      const tgGatewayToken = Deno.env.get("TELEGRAM_GATEWAY_TOKEN");
      if (tgGatewayToken) {
        try {
          const tgRes = await fetch("https://gatewayapi.telegram.org/sendVerificationMessage", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${tgGatewayToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phone_number: e164Phone,
              code: otp,
              ttl: OTP_EXPIRY_MINUTES * 60,
            }),
          });

          const tgData = await tgRes.json();
          if (tgRes.ok && tgData.ok) {
            return json({
              success: true,
              channel: "telegram_gateway",
              phone: e164Phone,
              message: "Verification code sent directly to your Telegram app",
            });
          }
          console.warn("Telegram Gateway attempt failed:", tgData);
        } catch (gwErr) {
          console.warn("Telegram Gateway call error:", gwErr);
        }
      }

      // 4. If Telegram is not connected yet, return actionable guidance
      return json({
        error: "telegram_not_connected",
        bot_username: "HRM_OPS_bot",
        bot_url: "https://t.me/HRM_OPS_bot?start=connect",
        phone: e164Phone,
        message: "Your Telegram is not connected yet. Click the link below to connect with @HRM_OPS_bot and receive your code for free.",
      }, 400);
    }

    // Normal email delivery
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

    const transporter = getTransporter();
    await transporter.sendMail({
      from: Deno.env.get("EMAIL_FROM") || "HRSystem <hrmsystem.ops@gmail.com>",
      to: normalizedEmail,
      subject: "Your Verification Code — HR System",
      html: emailHtml,
    });

    return json({ success: true, channel: "email", message: "OTP sent successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Send OTP error:", err);
    return json({ error: message }, 500);
  }
});
