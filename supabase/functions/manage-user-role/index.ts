import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

function isBootstrapAdminEmail(email?: string | null) {
  const bootstrapEmails = (Deno.env.get("BOOTSTRAP_ADMIN_EMAILS") || "admin@hrmops.com")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return !!email && bootstrapEmails.includes(email.toLowerCase());
}

function parseAssignmentId(value: unknown) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function parseRoleId(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Manage role function is missing Supabase environment variables" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: currentUser, error: userError } = await admin.auth.getUser(token);
    if (userError || !currentUser?.user) return json({ error: "Not authenticated" }, 401);

    if (!isBootstrapAdminEmail(currentUser.user.email)) {
      const email = currentUser.user.email?.toLowerCase() || "";
      const { data: assignment, error: assignmentError } = await admin
        .from("user_role_assignments")
        .select("app_roles(is_admin)")
        .or(`user_id.eq.${currentUser.user.id},email.eq.${email}`)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();

      if (assignmentError) throw assignmentError;

      const role = assignment?.app_roles as { is_admin?: boolean } | null;
      if (!role?.is_admin) return json({ error: "Not authorized" }, 403);
    }

    const { action, assignment_id, role_id, email, display_name } = await req.json();
    if (action === "list_deleted_users") {
      const { data, error } = await admin
        .from("user_role_assignments")
        .select("*, app_roles(id, name, color)")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (error) throw error;
      return json({ users: data || [] });
    }

    const assignmentId = parseAssignmentId(assignment_id);

    if (action === "update_role") {
      const roleId = parseRoleId(role_id);
      if (roleId === undefined) return json({ error: "Valid role_id is required" }, 400);

      if (assignmentId) {
        const { data, error } = await admin
          .from("user_role_assignments")
          .update({ role_id: roleId, updated_at: new Date().toISOString() })
          .eq("id", assignmentId)
          .select("id")
          .maybeSingle();

        if (error) throw error;
        if (!data) return json({ error: "Assignment not found" }, 404);
        return json({ success: true });
      } else if (email) {
        const normalizedEmail = String(email).trim().toLowerCase();
        const { error } = await admin
          .from("user_role_assignments")
          .upsert({
            email: normalizedEmail,
            display_name: display_name ? String(display_name).trim() : null,
            role_id: roleId,
            updated_at: new Date().toISOString(),
          }, { onConflict: "email" });

        if (error) throw error;
        return json({ success: true });
      } else {
        return json({ error: "Valid assignment_id or email is required" }, 400);
      }
    }

    if (action === "delete_assignment") {
      if (assignmentId) {
        const { error } = await admin
          .from("user_role_assignments")
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by: currentUser.user.email || currentUser.user.id,
            role_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", assignmentId);

        if (error) throw error;
        return json({ success: true });
      } else if (email) {
        const normalizedEmail = String(email).trim().toLowerCase();
        const { error } = await admin
          .from("user_role_assignments")
          .upsert({
            email: normalizedEmail,
            display_name: display_name ? String(display_name).trim() : null,
            deleted_at: new Date().toISOString(),
            deleted_by: currentUser.user.email || currentUser.user.id,
            role_id: null,
            updated_at: new Date().toISOString(),
          }, { onConflict: "email" });

        if (error) throw error;
        return json({ success: true });
      } else {
        return json({ error: "Valid assignment_id or email is required" }, 400);
      }
    }

    if (!assignmentId) return json({ error: "Valid assignment_id is required" }, 400);

    if (action === "restore_assignment") {
      const { error } = await admin
        .from("user_role_assignments")
        .update({
          deleted_at: null,
          deleted_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", assignmentId);

      if (error) throw error;
      return json({ success: true });
    }

    if (action === "delete_user_forever") {
      const { data: assignment, error: lookupError } = await admin
        .from("user_role_assignments")
        .select("user_id")
        .eq("id", assignmentId)
        .maybeSingle();

      if (lookupError) throw lookupError;
      if (!assignment) return json({ error: "Assignment not found" }, 404);
      if (assignment.user_id) {
        const { error: authDeleteError } = await admin.auth.admin.deleteUser(assignment.user_id);
        if (authDeleteError) throw authDeleteError;
      }

      const { error } = await admin
        .from("user_role_assignments")
        .delete()
        .eq("id", assignmentId);

      if (error) throw error;
      return json({ success: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err: any) {
    console.error("Manage user role error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
