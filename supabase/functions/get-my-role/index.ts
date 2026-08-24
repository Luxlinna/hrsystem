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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_SECRET_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return json({ error: "Role function is missing Supabase environment variables" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "Not authenticated" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Direct GoTrue validation — see list-auth-users for why we avoid
    // admin.auth.getUser(token) in edge isolates.
    const authResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: serviceRoleKey },
    });
    if (!authResponse.ok) {
      const bodyText = await authResponse.text().catch(() => "");
      console.error("get-my-role token validation failed:", authResponse.status, bodyText);
      return json({ error: "Not authenticated", detail: bodyText.slice(0, 300) || String(authResponse.status) }, 401);
    }
    const callerUser = await authResponse.json();

    const email = callerUser.email?.toLowerCase() || "";

    const { data, error } = await admin
      .from("user_role_assignments")
      .select("*, app_roles(*)")
      .or(`user_id.eq.${callerUser.id},email.eq.${email}`)
      .order("user_id", { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return json({ assignment: data || null });
  } catch (err: any) {
    console.error("Get my role error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
