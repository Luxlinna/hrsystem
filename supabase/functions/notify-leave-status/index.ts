import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { employee_name, leave_type, status, start_date, end_date } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const isApproved = status === "approved";
    const title = isApproved
      ? "Leave Request Approved ✓"
      : "Leave Request Rejected";
    const message = isApproved
      ? `Your ${leave_type} leave from ${start_date} to ${end_date} has been approved.`
      : `Your ${leave_type} leave from ${start_date} to ${end_date} has been rejected. Please contact HR for more information.`;

    // Insert notification record into Supabase
    await supabase.from("notifications").insert({
      title,
      message,
      type: isApproved ? "leave_approved" : "leave_rejected",
      is_read: false,
    });

    // Send FCM push notification if server key is configured
    if (fcmServerKey) {
      // Fetch all registered FCM tokens
      const { data: tokens } = await supabase
        .from("fcm_tokens")
        .select("token")
        .limit(500);

      if (tokens && tokens.length > 0) {
        const registrationIds = tokens.map((t: { token: string }) => t.token);

        const fcmPayload = {
          registration_ids: registrationIds,
          notification: {
            title,
            body: message,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            click_action: "/leave",
          },
          data: {
            type: isApproved ? "leave_approved" : "leave_rejected",
            employee_name,
            leave_type,
            status,
          },
        };

        const fcmResponse = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Authorization": `key=${fcmServerKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fcmPayload),
        });

        const fcmResult = await fcmResponse.json();
        console.log("FCM response:", JSON.stringify(fcmResult));
      }
    }

    return new Response(
      JSON.stringify({ success: true, title, message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in notify-leave-status:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
