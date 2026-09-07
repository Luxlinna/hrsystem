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
    const { email, identifier } = await req.json();
    const rawInput = (identifier || email || "").trim();

    if (!rawInput || typeof rawInput !== "string") {
      return json({ error: "Phone number or email is required" }, 400);
    }

    const isPhone = isPhoneInput(rawInput);
    const cleanDigits = isPhone ? normalizePhone(rawInput) : "";
    const normalizedEmail = isPhone
      ? `${cleanDigits}${PHONE_EMAIL_DOMAIN}`
      : rawInput.toLowerCase().trim();

    const generic = {
      success: true,
      message: isPhone
        ? "Your request has been submitted to an administrator. Once approved, you will receive a new setup link via Telegram."
        : "Your request has been submitted to an administrator for approval. Once approved, you will receive a password reset link via email."
    };
    const authUser = await findUserByEmail(admin, normalizedEmail);

    if (!authUser) return json(generic);

    const { data: existing } = await admin
      .from("password_reset_requests")
      .select("id")
      .eq("email", normalizedEmail)
      .eq("status", "pending")
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const requestId = existing?.id || crypto.randomUUID();
    if (!existing) {
      const { error: insertError } = await admin.from("password_reset_requests").insert({
        id: requestId,
        user_id: authUser.id,
        email: normalizedEmail,
      });
      if (insertError) {
        console.error("password reset request insert failed:", insertError);
        return json({ error: "Could not submit reset request" }, 500);
      }
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

    return json(generic);
  } catch (err: any) {
    console.error("request-password-reset error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
