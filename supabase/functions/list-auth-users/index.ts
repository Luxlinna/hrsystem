import { createClient } from "@supabase/supabase-js";

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
    const isAllowedBranchAdmin = Boolean(
      role?.name && (/branch\s*admin|bu\s*.*admin|bu\s*ceo/i.test(role.name))
    );
    if (!role?.is_admin && !isAllowedBranchAdmin) return json({ error: "Not authorized" }, 403);

    const users = [];
    let page = 1;
    const perPage = 1000;

    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      users.push(
        ...data.users.map((user: any) => {
          const isInvitePending = Boolean(user.user_metadata?.invite_pending);
          return {
            id: user.id,
            email: user.email,
            display_name:
              user.user_metadata?.display_name ||
              user.user_metadata?.full_name ||
              null,
            created_at: user.created_at,
            email_confirmed_at: isInvitePending ? null : (user.email_confirmed_at ?? null),
            confirmed_at: isInvitePending ? null : ((user as any).confirmed_at ?? null),
            invite_pending: isInvitePending,
          };
        })
      );

      if (data.users.length < perPage) break;
      page += 1;
    }

    const { data: allAssignments, error: assignmentsError } = await admin
      .from("user_role_assignments")
      .select("*, app_roles(id, name, color)")
      .order("created_at", { ascending: false });

    if (assignmentsError) throw assignmentsError;

    const deletedEmails = new Set(
      (allAssignments || [])
        .filter((a) => Boolean(a.deleted_at))
        .map((a) => a.email?.toLowerCase().trim())
        .filter(Boolean)
    );
    const deletedUserIds = new Set(
      (allAssignments || [])
        .filter((a) => Boolean(a.deleted_at))
        .map((a) => a.user_id)
        .filter(Boolean)
    );

    // Build a set of all auth user IDs that have ANY assignment row (active or deleted).
    // Auth users with NO row at all are "orphaned" — their assignment was permanently deleted
    // by a broken fallback that wiped the DB row without deleting the auth account.
    // We track these so the frontend doesn't synthesize them back as "unassigned active users".
    const allAssignedEmails = new Set(
      (allAssignments || [])
        .map((a) => a.email?.toLowerCase().trim())
        .filter(Boolean)
    );
    const allAssignedUserIds = new Set(
      (allAssignments || [])
        .map((a) => a.user_id)
        .filter(Boolean)
    );

    const orphanedAuthUserIds: string[] = users
      .filter((u) => {
        // An auth user is "orphaned" if they have no assignment row at all
        const hasAssignmentById = u.id && allAssignedUserIds.has(u.id);
        const hasAssignmentByEmail = u.email && allAssignedEmails.has(u.email.toLowerCase().trim());
        return !hasAssignmentById && !hasAssignmentByEmail;
      })
      .map((u) => u.id)
      .filter(Boolean);

    // Filter out users who have been soft-deleted / moved to Recycle Bin
    const activeAuthUsers = users.filter((u) => {
      if (u.id && deletedUserIds.has(u.id)) return false;
      if (u.email && deletedEmails.has(u.email.toLowerCase().trim())) return false;
      return true;
    });

    const activeAssignments = (allAssignments || []).filter((a) => !a.deleted_at);
    const deletedAssignments = (allAssignments || []).filter((a) => Boolean(a.deleted_at));

    return json({
      users: activeAuthUsers,
      assignments: activeAssignments,
      deleted_assignments: deletedAssignments,
      orphaned_auth_user_ids: orphanedAuthUserIds,
    });
  } catch (err: any) {
    console.error("List auth users error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
