import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "https://esm.sh/@simplewebauthn/server@10.0.1?target=deno";

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

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
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
      .select("id")
      .eq("email", userData.user.email)
      .maybeSingle();
    if (!employee) return json({ error: "No employee record linked to this account." }, 404);

    const body = await req.json();
    const rpID = body.rpID as string;
    if (!rpID) return json({ error: "Missing rpID" }, 400);

    if (body.step === "options") {
      const { data: creds } = await admin
        .from("webauthn_credentials")
        .select("credential_id")
        .eq("employee_id", employee.id);

      if (!creds || creds.length === 0) {
        return json({ error: "No fingerprint registered for this device yet." }, 404);
      }

      const options = await generateAuthenticationOptions({
        rpID,
        userVerification: "required",
        allowCredentials: creds.map((c) => ({ id: c.credential_id })),
      });

      await admin.from("webauthn_challenges").delete().eq("employee_id", employee.id).eq("purpose", "authenticate");
      await admin.from("webauthn_challenges").insert({
        employee_id: employee.id,
        challenge: options.challenge,
        purpose: "authenticate",
      });

      return json({ options });
    }

    if (body.step === "verify") {
      const { data: challengeRow } = await admin
        .from("webauthn_challenges")
        .select("*")
        .eq("employee_id", employee.id)
        .eq("purpose", "authenticate")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!challengeRow) return json({ error: "Verification expired — please try again." }, 400);

      const credId = body.response?.id as string | undefined;
      if (!credId) return json({ error: "Malformed request." }, 400);

      const { data: cred } = await admin
        .from("webauthn_credentials")
        .select("*")
        .eq("credential_id", credId)
        .eq("employee_id", employee.id)
        .maybeSingle();
      if (!cred) return json({ error: "Unknown device." }, 400);

      const verification = await verifyAuthenticationResponse({
        response: body.response,
        expectedChallenge: challengeRow.challenge,
        expectedOrigin: body.origin,
        expectedRPID: rpID,
        authenticator: {
          credentialID: cred.credential_id,
          credentialPublicKey: base64ToBytes(cred.public_key),
          counter: cred.counter,
        },
        requireUserVerification: true,
      });

      if (!verification.verified) return json({ error: "Verification failed." }, 400);

      await admin
        .from("webauthn_credentials")
        .update({ counter: verification.authenticationInfo.newCounter, last_used_at: new Date().toISOString() })
        .eq("id", cred.id);
      await admin.from("webauthn_challenges").delete().eq("id", challengeRow.id);

      return json({ verified: true });
    }

    return json({ error: "Unknown step" }, 400);
  } catch (err) {
    console.error("webauthn-authenticate error:", err);
    return json({ error: String(err) }, 500);
  }
});
