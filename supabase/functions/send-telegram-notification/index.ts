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
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

    if (!botToken || !chatId) {
      return json(
        { error: "Telegram notifications aren't configured yet (missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)." },
        501
      );
    }

    // Require a signed-in caller (same pattern as send-push-notification) —
    // this endpoint posts into a shared group, so it shouldn't be callable
    // anonymously even though the payload itself isn't sensitive.
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Not authenticated" }, 401);

    const { message, buttonText, buttonUrl } = await req.json();
    if (!message || typeof message !== "string") return json({ error: "Missing message" }, 400);

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
        chat_id: chatId,
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
