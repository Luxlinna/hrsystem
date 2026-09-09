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

// Generic Telegram group notifier — any HR event (attendance, leave,
// onboarding, ...) can call this with a preformatted HTML message. Bot
// token and chat id live only as Edge Function secrets (never in the
// database) since they're effectively credentials for posting to the group.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || anonKey;
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");

    if (!botToken) {
      return json(
        { error: "Telegram notifications aren't configured yet (missing TELEGRAM_BOT_TOKEN)." },
        501
      );
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Look up action notifications group chat ID
    let targetChatId: string | null = null;
    const { data: notifSetting } = await admin
      .from("system_settings")
      .select("value")
      .eq("key", "telegram_notifications_chat_id")
      .maybeSingle();

    // Fetch OTP chat ID so we can strictly forbid sending action notifications to the OTP group
    const { data: otpSetting } = await admin
      .from("system_settings")
      .select("value")
      .eq("key", "telegram_otp_chat_id")
      .maybeSingle();
    const otpChatId = (otpSetting?.value || "-5356924617").trim();

    if (notifSetting?.value && notifSetting.value.trim() !== "") {
      targetChatId = notifSetting.value.trim();
    } else {
      // Check legacy setting ONLY if it does not match the OTP chat
      const { data: legacySetting } = await admin
        .from("system_settings")
        .select("value")
        .eq("key", "telegram_group_chat_id")
        .maybeSingle();
      const legVal = legacySetting?.value?.trim() || "";
      if (legVal && legVal !== otpChatId && legVal !== "-5356924617") {
        targetChatId = legVal;
      }
    }

    // Require a signed-in caller or service role key
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    let isAuthorized = false;

    const sKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY");
    if (sKey && token === sKey) {
      isAuthorized = true;
    } else {
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: userData, error: userErr } = await userClient.auth.getUser();
      if (!userErr && userData?.user) isAuthorized = true;
    }

    if (!isAuthorized) return json({ error: "Not authenticated" }, 401);

    const body = await req.json().catch(() => ({}));
    const { message, buttonText, buttonUrl, chat_id } = body;
    if (!message || typeof message !== "string") return json({ error: "Missing message" }, 400);

    const resolvedChatId = chat_id ? String(chat_id).trim() : targetChatId;

    // HARD GUARD: NEVER EVER send action notifications to the OTP channel!
    if (resolvedChatId && (resolvedChatId === otpChatId || resolvedChatId === "-5356924617")) {
      console.warn(`[send-telegram-notification] Blocked: attempt to send action notification to OTP group (${resolvedChatId})`);
      return json(
        {
          error: "Action notifications cannot be sent to the OTP group. Please link HRM_OPS_Notifications channel.",
          blocked_otp_channel: true,
        },
        400
      );
    }

    if (!resolvedChatId) {
      console.warn("[send-telegram-notification] Skipped: telegram_notifications_chat_id is not configured yet.");
      return json(
        { error: "Action notifications Telegram group is not configured yet. Please add @HRM_OPS_bot to HRM_OPS_Notifications and send /set_notifications in that group." },
        400
      );
    }

    // Optional inline "open in app" button — only attached when the caller
    // supplies both a label and an http(s) URL.
    const replyMarkup =
      buttonText && buttonUrl && typeof buttonUrl === "string" && /^https?:\/\//.test(buttonUrl)
        ? { inline_keyboard: [[{ text: String(buttonText), url: buttonUrl }]] }
        : undefined;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: resolvedChatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      }),
    });

    const result = await res.json();
    if (!result.ok) {
      console.error("Telegram sendMessage failed:", result);
      return json({ error: result.description || "Telegram API error" }, 502);
    }

    return json({ sent: true });
  } catch (err) {
    console.error("send-telegram-notification error:", err);
    return json({ error: String(err) }, 500);
  }
});
