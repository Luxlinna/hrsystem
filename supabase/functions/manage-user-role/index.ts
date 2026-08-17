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
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: currentUser, error: userError } = await userClient.auth.getUser();
    if (userError || !currentUser?.user) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    if (!isBootstrapAdminEmail(currentUser.user.email)) {
      const { data: assignment, error: assignmentError } = await admin
        .from("user_role_assignments")
        .select("app_roles(is_admin)")
        .or(`user_id.eq.${currentUser.user.id},email.eq.${currentUser.user.email?.toLowerCase() || ""}`)
        .maybeSingle();

      if (assignmentError) throw assignmentError;

      const role = assignment?.app_roles as { is_admin?: boolean } | null;
      if (!role?.is_admin) return json({ error: "Not authorized" }, 403);
    }

    const { action, assignment_id, role_id } = await req.json();
    const assignmentId = parseAssignmentId(assignment_id);
    if (!assignmentId) return json({ error: "Valid assignment_id is required" }, 400);

    if (action === "update_role") {
      const roleId = parseRoleId(role_id);
      if (roleId === undefined) return json({ error: "Valid role_id is required" }, 400);

      const { data, error } = await admin
        .from("user_role_assignments")
        .update({ role_id: roleId, updated_at: new Date().toISOString() })
        .eq("id", assignmentId)
        .select("id")
        .maybeSingle();

      if (error) throw error;
      if (!data) return json({ error: "Assignment not found" }, 404);
      return json({ success: true });
    }

    if (action === "delete_assignment") {
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
