import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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

function isPhoneSyntheticEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(PHONE_EMAIL_DOMAIN);
}

function isBootstrapAdminEmail(email?: string | null) {
  const bootstrapEmails = (Deno.env.get("BOOTSTRAP_ADMIN_EMAILS") || "admin@hrmops.com")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return !!email && bootstrapEmails.includes(email.toLowerCase());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Missing Supabase environment variables" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Validate caller token
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: serviceRoleKey },
    });
    if (!authResponse.ok) {
      const bodyText = await authResponse.text().catch(() => "");
      console.error("Token validation failed:", authResponse.status, bodyText);
      return json({ error: "Not authenticated" }, 401);
    }
    const currentUser = await authResponse.json();

    // Verify caller is admin or branch admin
    if (!isBootstrapAdminEmail(currentUser.email)) {
      const email = currentUser.email?.toLowerCase() || "";
      const { data: assignment, error: assignmentError } = await admin
        .from("user_role_assignments")
        .select("app_roles(name, is_admin)")
        .or(`user_id.eq.${currentUser.id},email.eq.${email}`)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();

      if (assignmentError) throw assignmentError;

      const role = assignment?.app_roles as { name?: string; is_admin?: boolean } | null;
      if (!role?.is_admin && role?.name !== "Branch Admin") {
        return json({ error: "Not authorized to create employee accounts" }, 403);
      }
    }

    const body = await req.json();
    const { employee_id, phone, password, display_name, role_id } = body;

    if (!phone || typeof phone !== "string" || !phone.trim()) {
      return json({ error: "Phone number is required" }, 400);
    }

    const cleanDigits = normalizePhone(phone);
    if (cleanDigits.length < 6) {
      return json({ error: "Please enter a valid phone number (minimum 6 digits)" }, 400);
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return json({ error: "Password must be at least 6 characters long" }, 400);
    }

    const syntheticEmail = `${cleanDigits}${PHONE_EMAIL_DOMAIN}`;
    const displayName = (display_name || "").trim() || `Staff ${cleanDigits}`;
    const parsedRoleId = role_id ? parseInt(role_id, 10) : null;

    let userId: string | null = null;

    // Check if auth user already exists for this synthetic email
    const listResult = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = (listResult.data?.users || []).find(
      (u) => u.email?.toLowerCase() === syntheticEmail.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
      // Update password & metadata
      const { error: updateAuthError } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: {
          ...existingUser.user_metadata,
          display_name: displayName,
          phone: cleanDigits,
          is_phone_account: true,
        },
      });
      if (updateAuthError) throw updateAuthError;
    } else {
      // Create new auth user
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email: syntheticEmail,
        password,
        email_confirm: true,
        user_metadata: {
          display_name: displayName,
          phone: cleanDigits,
          is_phone_account: true,
        },
      });

      if (createError) {
        console.error("Create user error:", createError);
        return json({ error: createError.message || "Failed to create user account" }, 500);
      }
      userId = createData.user.id;
    }

    if (!userId) {
      return json({ error: "Could not retrieve user ID" }, 500);
    }

    // Safe insert or update into user_role_assignments
    const { data: existingAssignment } = await admin
      .from("user_role_assignments")
      .select("id")
      .ilike("email", syntheticEmail)
      .maybeSingle();

    if (existingAssignment?.id) {
      const { error: roleUpdateError } = await admin
        .from("user_role_assignments")
        .update({
          user_id: userId,
          display_name: displayName,
          role_id: parsedRoleId,
          deleted_at: null,
          deleted_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingAssignment.id);

      if (roleUpdateError) {
        console.error("user_role_assignments update error:", roleUpdateError);
        throw roleUpdateError;
      }
    } else {
      const { error: roleInsertError } = await admin
        .from("user_role_assignments")
        .insert({
          email: syntheticEmail,
          user_id: userId,
          display_name: displayName,
          role_id: parsedRoleId,
          deleted_at: null,
          deleted_by: null,
          updated_at: new Date().toISOString(),
        });

      if (roleInsertError) {
        console.error("user_role_assignments insert error:", roleInsertError);
        throw roleInsertError;
      }
    }

    // Link in employees table if employee_id provided or matching employee found
    if (employee_id) {
      const { data: currentEmp } = await admin
        .from("employees")
        .select("id, email, phone")
        .eq("id", employee_id)
        .maybeSingle();

      const updatePayload: Record<string, any> = { phone: cleanDigits };
      if (isPhoneSyntheticEmail(currentEmp?.email)) {
        updatePayload.email = null;
      }
      const { error: empError } = await admin
        .from("employees")
        .update(updatePayload)
        .eq("id", employee_id);

      if (empError) {
        console.error("Update employee error:", empError);
      }
    } else {
      // If no employee_id, check if employee exists with this phone or email
      const { data: matchingEmps } = await admin
        .from("employees")
        .select("id, email, phone")
        .or(`phone.eq.${cleanDigits},phone.eq.${phone}`)
        .is("deleted_at", null)
        .limit(1);

      if (matchingEmps && matchingEmps.length > 0) {
        const emp = matchingEmps[0];
        const updatePayload: Record<string, any> = { phone: cleanDigits };
        if (isPhoneSyntheticEmail(emp.email)) {
          updatePayload.email = null;
        }
        await admin
          .from("employees")
          .update(updatePayload)
          .eq("id", emp.id);
      }
    }

    return json({
      success: true,
      message: "Phone user account set up successfully",
      user: {
        id: userId,
        phone: cleanDigits,
        email: syntheticEmail,
        display_name: displayName,
      },
    });
  } catch (err: any) {
    console.error("create-phone-user error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
