import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

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

function isBootstrapAdminEmail(email?: string | null) {
  const bootstrapEmails = (Deno.env.get("BOOTSTRAP_ADMIN_EMAILS") || "admin@hrmops.com")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return !!email && bootstrapEmails.includes(email.toLowerCase());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "List users function is missing Supabase environment variables" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Validate caller JWT
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: serviceRoleKey },
    });
    if (!authResponse.ok) {
      const bodyText = await authResponse.text().catch(() => "");
      console.error("list-auth-users token validation failed:", authResponse.status, bodyText);
      return json({ error: "Not authenticated", detail: bodyText.slice(0, 300) || String(authResponse.status) }, 401);
    }
    const callerUser = await authResponse.json();

    if (!isBootstrapAdminEmail(callerUser.email)) {
      const email = callerUser.email?.toLowerCase() || "";
      const { data: assignment, error: assignmentError } = await admin
        .from("user_role_assignments")
        .select("app_roles(name, is_admin)")
        .or(`user_id.eq.${callerUser.id},email.eq.${email}`)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();

      if (assignmentError) throw assignmentError;

      const role = assignment?.app_roles as { name?: string; is_admin?: boolean } | null;
      if (!role?.is_admin && role?.name !== "Branch Admin") return json({ error: "Not authorized" }, 403);
    }

    const users = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      users.push(
        ...data.users.map((user) => ({
          id: user.id,
          email: user.email,
          display_name:
            user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            null,
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at ?? null,
          confirmed_at: (user as any).confirmed_at ?? null,
        }))
      );

      if (data.users.length < perPage) break;
      page += 1;
    }

    const { data: assignments, error: assignmentsError } = await admin
      .from("user_role_assignments")
      .select("*, app_roles(id, name, color)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (assignmentsError) throw assignmentsError;

    return json({ users, assignments: assignments || [] });
  } catch (err: any) {
    console.error("List auth users error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
