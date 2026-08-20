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

async function hashOTP(otp: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(otp);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const OTP_MAX_ATTEMPTS = 5;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { email, otp } = await req.json();

    if (!email || typeof email !== "string") {
      return json({ error: "Email is required" }, 400);
    }
    if (!otp || typeof otp !== "string") {
      return json({ error: "OTP code is required" }, 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const submittedOtp = otp.trim();

    // Find the latest unverified, non-expired OTP
    const { data: otpRecord, error: lookupError } = await admin
      .from("email_otps")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("verified", false)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupError) {
      console.error("OTP lookup error:", lookupError);
      return json({ error: "Failed to verify OTP" }, 500);
    }

    if (!otpRecord) {
      return json({ error: "OTP expired or not found. Please request a new code." }, 400);
    }

    // Check attempt limit
    if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
      // Mark as verified to prevent further attempts
      await admin
        .from("email_otps")
        .update({ verified: true })
        .eq("id", otpRecord.id);

      return json({ error: "Too many failed attempts. Please request a new code." }, 400);
    }

    // Verify OTP hash
    const submittedHash = await hashOTP(submittedOtp);

    if (submittedHash !== otpRecord.otp_hash) {
      // Increment attempts
      const newAttempts = otpRecord.attempts + 1;
      await admin
        .from("email_otps")
        .update({ attempts: newAttempts })
        .eq("id", otpRecord.id);

      const remaining = OTP_MAX_ATTEMPTS - newAttempts;
      if (remaining <= 0) {
        return json({ error: "Too many failed attempts. Please request a new code." }, 400);
      }
      return json({ error: `Invalid code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` }, 400);
    }

    // OTP verified successfully
    await admin
      .from("email_otps")
      .update({ verified: true })
      .eq("id", otpRecord.id);

    return json({ success: true, message: "OTP verified successfully" });
  } catch (err: any) {
    console.error("Verify OTP error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
