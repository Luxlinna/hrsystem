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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFrom = Deno.env.get("RESEND_FROM") || "HRSystem <noreply@hrmops.com>";

    if (!resendApiKey) {
      return json({ error: "RESEND_API_KEY not configured" }, 500);
    }

    const { to, subject, html } = await req.json();

    if (!to || !subject || !html) {
      return json({ error: "to, subject, and html are required" }, 400);
    }

    const recipients = Array.isArray(to) ? to : [to];

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFrom,
        to: recipients,
        subject,
        html,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Resend API error:", resendError);
      return json({ error: "Failed to send email" }, 500);
    }

    const data = await resendResponse.json();
    return json({ success: true, id: data.id });
  } catch (err: any) {
    console.error("Send email error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
