import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "nodemailer";
import { getClientIp, checkRateLimit, rateLimitResponse } from "../_shared/rate-limiter.ts";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || anonKey;

    // Require authenticated caller or service role
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    let isAuthorized = false;
    let userId = "service-role";

    if (token === serviceRoleKey) {
      isAuthorized = true;
    } else {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (!userErr && userData?.user) {
        isAuthorized = true;
        userId = userData.user.id;
      }
    }

    if (!isAuthorized) {
      return json({ error: "Not authenticated" }, 401);
    }

    // Rate limit: max 10 emails per 5 minutes per user / IP
    const clientIp = getClientIp(req);
    const ipLimit = await checkRateLimit(admin, `send-email:ip:${clientIp}`, 15, 300);
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.retryAfterSeconds, undefined, corsHeaders);
    }

    if (userId !== "service-role") {
      const userLimit = await checkRateLimit(admin, `send-email:user:${userId}`, 10, 300);
      if (!userLimit.allowed) {
        return rateLimitResponse(userLimit.retryAfterSeconds, undefined, corsHeaders);
      }
    }

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
