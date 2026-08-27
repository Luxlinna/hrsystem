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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const from = Deno.env.get("EMAIL_FROM") || "HR System <hrmsystem.ops@gmail.com>";

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return json({ error: "to, subject, and html are required" }, 400);
    }

    const recipients = Array.isArray(to) ? to : [to];
    const transporter = getTransporter();

    const result = await transporter.sendMail({
      from,
      to: recipients.join(", "),
      subject,
      html,
    });

    return json({ success: true, id: result.messageId });
  } catch (err: any) {
    console.error("Send email error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
