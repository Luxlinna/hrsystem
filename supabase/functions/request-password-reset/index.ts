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

    const { email, identifier, company_hp, honeypot, website } = body;

    // 1. Anti-Bot Honeypot: automated spam scripts fill invisible fields; drop them instantly
    if (company_hp || honeypot || website) {
      return json({ error: "Invalid submission" }, 400);
    }

    const rawInput = (identifier || email || "").trim();

    if (!rawInput || typeof rawInput !== "string") {
      return json({ error: "Phone number or email is required" }, 400);
    }

    // Input length sanity limit to prevent oversized payload attacks
    if (rawInput.length > 100) {
      return json({ error: "Invalid identifier length" }, 400);
    }

    const isPhone = isPhoneInput(rawInput);
    const cleanDigits = isPhone ? normalizePhone(rawInput) : "";
    const normalizedEmail = isPhone
      ? `${cleanDigits}${PHONE_EMAIL_DOMAIN}`
      : rawInput.toLowerCase().trim();

    // 2. Strict Layered Rate Limiting:
    // A. IP Rate Limit: Max 5 requests per 15 minutes per IP address
    const clientIp = getClientIp(req);
    const ipLimit = await checkRateLimit(admin, `pwd-reset:ip:${clientIp}`, 5, 900);
    if (!ipLimit.allowed) {
      return rateLimitResponse(
        ipLimit.retryAfterSeconds,
        `Too many requests from your IP. Please wait ${Math.ceil(ipLimit.retryAfterSeconds / 60)} minute(s) before trying again.`,
        corsHeaders
      );
    }

    // B. Account Target Rate Limit: Max 3 requests per 15 minutes per email/phone
    // Stops attackers using distributed IPs / proxies from targeting a single user
    const accountLimit = await checkRateLimit(admin, `pwd-reset:account:${normalizedEmail}`, 3, 900);
    if (!accountLimit.allowed) {
      return rateLimitResponse(
        accountLimit.retryAfterSeconds,
        `Too many password reset requests for this account. Please wait ${Math.ceil(accountLimit.retryAfterSeconds / 60)} minute(s) before trying again.`,
        corsHeaders
      );
    }

    // 3. User Management Account Check:
    // The user MUST exist in User Management (user_role_assignments) and cannot be deleted/in recycle bin
    const { data: assignment, error: assignmentError } = await admin
      .from("user_role_assignments")
      .select("id, user_id, email, display_name, deleted_at")
      .ilike("email", normalizedEmail)
      .is("deleted_at", null)
      .maybeSingle();

    if (assignmentError) {
      console.warn("user_role_assignments check warning:", assignmentError.message);
    }

    if (!assignment) {
      return json({
        error: `No user account found for "${rawInput}". Please make sure your account has been created by an administrator in User Management.`
      }, 404);
    }

    // 4. Auth Credentials Check:
    const authUser = await findUserByEmail(admin, normalizedEmail);

    if (!authUser && !assignment.user_id) {
      return json({
        error: `No login credentials found for "${rawInput}". Please contact your administrator in User Management.`
      }, 404);
    }

    const targetUserId = assignment.user_id || authUser?.id;

    // 5. Pending Request Lockout:
    // If a request is ALREADY pending admin approval, do NOT allow spamming duplicate requests or admin notifications
    const { data: existing } = await admin
      .from("password_reset_requests")
      .select("id, status, admin_note")
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      return json({
        success: true,
        requestId: existing.id,
        isPhone,
        normalizedEmail,
        alreadyPending: true,
        message: isPhone
          ? "A password reset request for this phone number is already pending admin approval. Please wait for an administrator to review it."
          : "A password reset request for this email is already pending admin approval. Please wait for an administrator to review it."
      });
    }

    const requestId = crypto.randomUUID();
    const { error: insertError } = await admin.from("password_reset_requests").insert({
      id: requestId,
      user_id: targetUserId,
      email: normalizedEmail,
    });
    if (insertError) {
      console.error("password reset request insert failed:", insertError);
    }

    const { data: admins } = await admin
      .from("user_role_assignments")
      .select("user_id, app_roles!inner(is_admin, allowed_modules)")
      .is("deleted_at", null)
      .not("user_id", "is", null);

    const contactDisplay = isPhone ? `Phone: ${cleanDigits}` : normalizedEmail;
    const adminNotifications = (admins || [])
      .filter((row: any) => {
        const role = Array.isArray(row.app_roles) ? row.app_roles[0] : row.app_roles;
        return role?.is_admin || role?.allowed_modules?.includes("*") || role?.allowed_modules?.includes("settings") || role?.allowed_modules?.includes("admin");
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
