import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} from "https://esm.sh/@simplewebauthn/server@10.0.1?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RP_NAME = "HR Nexus";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user?.email) {
      return json({ error: "Not authenticated" }, 401);
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: employee } = await admin
      .from("employees")
      .select("id, first_name, last_name")
      .eq("email", userData.user.email)
      .maybeSingle();
    if (!employee) return json({ error: "No employee record linked to this account." }, 404);

    const body = await req.json();
    const rpID = body.rpID as string;
    if (!rpID) return json({ error: "Missing rpID" }, 400);

    if (body.step === "options") {
      const { data: existing } = await admin
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("employee_id", employee.id);

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID,
        userID: new TextEncoder().encode(employee.id),
        userName: userData.user.email,
        userDisplayName: `${employee.first_name} ${employee.last_name}`,
        attestationType: "none",
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "preferred",
          userVerification: "required",
        },
        excludeCredentials: (existing || []).map((c) => ({ id: c.credential_id })),
      });

      await admin.from("webauthn_challenges").delete().eq("employee_id", employee.id).eq("purpose", "register");
      await admin.from("webauthn_challenges").insert({
        employee_id: employee.id,
        challenge: options.challenge,
        purpose: "register",
      });

      return json({ options });
    }

    if (body.step === "verify") {
      const { data: challengeRow } = await admin
        .from("webauthn_challenges")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("purpose", "register")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!challengeRow) return json({ error: "Registration expired — please try again." }, 400);

      const verification = await verifyRegistrationResponse({
        response: body.response,
        expectedChallenge: challengeRow.challenge,
        expectedOrigin: body.origin,
        expectedRPID: rpID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return json({ error: "Verification failed." }, 400);
      }

      const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;
      await admin.from("webauthn_credentials").insert({
        employee_id: employee.id,
        credential_id: credentialID,
        public_key: bytesToBase64(credentialPublicKey),
        counter,
        device_label: body.deviceLabel || "This device",
      });

      await admin.from("webauthn_challenges").delete().eq("id", challengeRow.id);

      return json({ verified: true });
    }

    return json({ error: "Unknown step" }, 400);
  } catch (err) {
    console.error("webauthn-register error:", err);
    return json({ error: String(err) }, 500);
  }
});
