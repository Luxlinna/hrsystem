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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS")?.replace(/\s+/g, "");
    const emailFrom = Deno.env.get("EMAIL_FROM") || `HRSystem <${smtpUser}>`;

    if (!smtpUser || !smtpPass) {
      return json({ error: "SMTP credentials not configured" }, 500);
    }

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return json({ error: "to, subject, and html are required" }, 400);
    }

    const recipients = Array.isArray(to) ? to : [to];

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: Deno.env.get("SMTP_SECURE") === "true",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const info = await transporter.sendMail({
      from: emailFrom,
      to: recipients.join(", "),
      subject,
      html,
    });

    return json({ success: true, id: info.messageId });
  } catch (err: any) {
    console.error("Send email error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
