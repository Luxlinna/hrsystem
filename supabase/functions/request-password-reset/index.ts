import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

const PHONE_EMAIL_DOMAIN = "@phone.hrmsystem.local";

function normalizePhone(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("855") && digits.length >= 11) {
    digits = "0" + digits.slice(3);
  }
  return digits;
}

function isPhoneInput(val: string): boolean {
  const digits = (val || "").replace(/\D/g, "");
  return !val.includes("@") && digits.length >= 8;
}

async function findUserByEmail(admin: any, email: string) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = data.users.find((item: any) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 1000) break;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();

    // 1. Check Status Action for live frontend polling
    if (body.action === "check_status" && body.requestId) {
      const { data: row } = await admin
        .from("password_reset_requests")
        .select("id, status, admin_note, acted_at")
        .eq("id", body.requestId)
        .maybeSingle();

      if (!row) return json({ status: "not_found" });
      return json({
        status: row.status,
        resetLink: row.status === "approved" ? row.admin_note : null,
        actedAt: row.acted_at,
      });
    }

    const { email, identifier } = body;
    const rawInput = (identifier || email || "").trim();

    if (!rawInput || typeof rawInput !== "string") {
      return json({ error: "Phone number or email is required" }, 400);
    }

    const isPhone = isPhoneInput(rawInput);
    const cleanDigits = isPhone ? normalizePhone(rawInput) : "";
    const normalizedEmail = isPhone
      ? `${cleanDigits}${PHONE_EMAIL_DOMAIN}`
      : rawInput.toLowerCase().trim();

    // 2. IP rate limit check (max 10 reset requests per 15 minutes per IP)
    const clientIp = getClientIp(req);
    const ipLimit = await checkRateLimit(admin, `pwd-reset:ip:${clientIp}`, 10, 900);
    if (!ipLimit.allowed) {
      return rateLimitResponse(ipLimit.retryAfterSeconds, undefined, corsHeaders);
    }

    const authUser = await findUserByEmail(admin, normalizedEmail);

    const { data: existing } = await admin
      .from("password_reset_requests")
      .select("id, status, admin_note")
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const requestId = existing?.id || crypto.randomUUID();
    if (!existing && authUser) {
      const { error: insertError } = await admin.from("password_reset_requests").insert({
        id: requestId,
        user_id: authUser.id,
        email: normalizedEmail,
      });
      if (insertError) {
        console.error("password reset request insert failed:", insertError);
      }
    }

    if (authUser) {
      const { data: admins } = await admin
        .from("user_role_assignments")
        .select("user_id, app_roles!inner(is_admin, allowed_modules)")
        .is("deleted_at", null)
        .not("user_id", "is", null);

      const contactDisplay = isPhone ? `Phone: ${cleanDigits}` : normalizedEmail;
      const adminNotifications = (admins || [])
        .filter((row: any) => {
          const role = Array.isArray(row.app_roles) ? row.app_roles[0] : row.app_roles;
          return role?.is_admin || role?.allowed_modules?.includes("*") || role?.allowed_modules?.includes("settings");
        })
        .map((row: any) => ({
          title: "Password Reset Approval Needed",
          message: `${contactDisplay} requested approval to reset their password.`,
          type: "warning",
          source: "password_reset",
          entity_id: requestId,
          recipient_user_id: row.user_id,
        }));

      if (adminNotifications.length > 0) {
        await admin.from("notifications").insert(adminNotifications);
      }
    }

    return json({
      success: true,
      requestId,
      isPhone,
      normalizedEmail,
      message: isPhone
        ? "Your request has been submitted to an administrator. Please keep this screen open while an admin approves it."
        : "Your request has been submitted to an administrator for approval. You can wait here or check your email once approved."
    });
  } catch (err: any) {
    console.error("request-password-reset error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
