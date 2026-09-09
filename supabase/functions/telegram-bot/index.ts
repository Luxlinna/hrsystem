import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PHONE_EMAIL_DOMAIN = "@phone.hrmsystem.local";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  if (digits.startsWith("855") && digits.length >= 11) {
    digits = "0" + digits.slice(3);
  }
  return digits;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";

  if (!botToken) {
    return json({ error: "TELEGRAM_BOT_TOKEN secret not configured" }, 500);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const url = new URL(req.url);

  // Handle GET request: Check bot status or auto-register webhook
  if (req.method === "GET") {
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meData = await meRes.json();

    let webhookStatus = null;
    if (url.searchParams.get("setup") === "webhook") {
      const webhookUrl = `${supabaseUrl}/functions/v1/telegram-bot`;
      const setRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      webhookStatus = await setRes.json();
    }

    let chatInfo = null;
    const checkChat = url.searchParams.get("check_chat");
    if (checkChat) {
      const cRes = await fetch(`https://api.telegram.org/bot${botToken}/getChat?chat_id=${checkChat}`);
      chatInfo = await cRes.json();
    }

    const envChatId = Deno.env.get("TELEGRAM_CHAT_ID") || null;

    return json({
      ok: true,
      bot: meData?.result,
      webhook_setup: webhookStatus,
      env_chat_id: envChatId,
      chat_info: chatInfo,
    });
  }

  // Handle POST request from Telegram Webhook
  try {
    const update = await req.json();

    // Case A: Bot added to a group or updated in a group
    const chatMember = update?.my_chat_member;
    if (chatMember && chatMember.chat) {
      const gChatId = chatMember.chat.id;
      const gTitle = chatMember.chat.title || "";
      if (typeof gChatId === "number" && gChatId < 0) {
        console.log(`[telegram-bot] Bot added/updated in group: ${gChatId} (${gTitle})`);
        const lowerTitle = gTitle.toLowerCase();
        const isOtp = lowerTitle.includes("otp");

        if (isOtp) {
          await admin.from("system_settings").upsert([
            { key: "telegram_otp_chat_id", value: String(gChatId), type: "text", updated_at: new Date().toISOString() },
            { key: "telegram_group_chat_id", value: String(gChatId), type: "text", updated_at: new Date().toISOString() },
          ], { onConflict: "key" });

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: gChatId,
              text: `🔐 <b>HRMsystem OTP Channel Connected!</b>\n\n<b>Group:</b> ${gTitle}\n<b>Group ID:</b> <code>${gChatId}</code>\n\n✅ <b>Only</b> login OTP verification codes will be sent to this group.`,
              parse_mode: "HTML",
            }),
          });
        } else {
          await admin.from("system_settings").upsert({
            key: "telegram_notifications_chat_id",
            value: String(gChatId),
            type: "text",
            updated_at: new Date().toISOString(),
          }, { onConflict: "key" });

          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: gChatId,
              text: `📢 <b>HRM_OPS Action Notifications Connected!</b>\n\n<b>Group:</b> ${gTitle}\n<b>Group ID:</b> <code>${gChatId}</code>\n\n✅ All system & user action notifications (attendance, leave requests, employee updates, meeting rooms, etc.) will be sent to this group.\n\n<i>To switch channel role: type /set_otp or /set_notifications</i>`,
              parse_mode: "HTML",
            }),
          });
        }

        return json({ ok: true });
      }
    }

    const message = update?.message;
    if (!message) {
      return json({ ok: true });
    }

    const chatId = message.chat?.id;
    const isGroup = message.chat?.type === "group" || message.chat?.type === "supergroup" || (typeof chatId === "number" && chatId < 0);

    // Case B: Any message sent in a group where the bot is a member
    if (isGroup) {
      const gTitle = message.chat?.title || "";
      const text = (message.text || "").trim();
      const lowerText = text.toLowerCase();
      const lowerTitle = gTitle.toLowerCase();

      console.log(`[telegram-bot] Received group message in: ${chatId} (${gTitle}): ${text}`);

      const wantsOtp = lowerText.startsWith("/set_otp") || lowerText.startsWith("/otp");
      const wantsNotif = lowerText.startsWith("/set_notif") || lowerText.startsWith("/notif");

      if (wantsOtp || (!wantsNotif && lowerTitle.includes("otp"))) {
        await admin.from("system_settings").upsert([
          { key: "telegram_otp_chat_id", value: String(chatId), type: "text", updated_at: new Date().toISOString() },
          { key: "telegram_group_chat_id", value: String(chatId), type: "text", updated_at: new Date().toISOString() },
        ], { onConflict: "key" });

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `🔐 <b>HRMsystem OTP Channel Active!</b>\n\n<b>Group:</b> ${gTitle || "This group"}\n<b>Group ID:</b> <code>${chatId}</code>\n\n✅ <b>Only</b> login OTP verification codes will be delivered here.`,
            parse_mode: "HTML",
          }),
        });
        return json({ ok: true });
      }

      if (wantsNotif || lowerTitle.includes("notif")) {
        await admin.from("system_settings").upsert({
          key: "telegram_notifications_chat_id",
          value: String(chatId),
          type: "text",
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `📢 <b>HRM_OPS Notifications Channel Active!</b>\n\n<b>Group:</b> ${gTitle || "This group"}\n<b>Group ID:</b> <code>${chatId}</code>\n\n✅ All system & user action notifications (attendance, leave, employee updates, meeting rooms, etc.) will be delivered here.`,
            parse_mode: "HTML",
          }),
        });
        return json({ ok: true });
      }

      if (lowerText.includes("/id") || lowerText.includes("/status") || lowerText.includes("/start") || lowerText.includes("/help")) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: `ℹ️ <b>Group Details</b>\n\n<b>Title:</b> ${gTitle}\n<b>Group ID:</b> <code>${chatId}</code>\n\n<b>Commands:</b>\n• <code>/set_notifications</code> — Send all user action notifications here\n• <code>/set_otp</code> — Send only login OTP codes here`,
            parse_mode: "HTML",
          }),
        });
      }

      return json({ ok: true });
    }

    // Case C: Private 1-on-1 chat with the bot
    // 1. User shared contact (native Telegram phone verification button)
    if (message.contact) {
      const rawContactPhone = message.contact.phone_number || "";
      const cleanPhone = normalizePhone(rawContactPhone);
      const syntheticEmail = `${cleanPhone}${PHONE_EMAIL_DOMAIN}`;

      console.log(`[telegram-bot] Received contact for phone: ${rawContactPhone} -> ${cleanPhone}, chatId: ${chatId}`);

      const settingKey = `tg_chat_${cleanPhone}`;
      await admin.from("system_settings").upsert({
        key: settingKey,
        value: String(chatId),
        type: "text",
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

      // Look up user in auth.users
      let userFound = false;
      const userRes = await fetch(
        `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(syntheticEmail)}`,
        {
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        }
      );
      const userList = await userRes.json();
      const user = userList?.users?.[0];

      if (user) {
        userFound = true;
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...user.user_metadata,
            telegram_chat_id: String(chatId),
            telegram_username: message.from?.username || null,
          },
        });
      } else {
        const { data: emp } = await admin
          .from("employees")
          .select("id, first_name, last_name, phone")
          .or(`phone.eq.${cleanPhone},phone.eq.${rawContactPhone},phone.eq.0${cleanPhone}`)
          .maybeSingle();

        if (emp) {
          userFound = true;
        }
      }

      const replyText = userFound
        ? `✅ <b>Successfully Connected!</b>\n\nYour Telegram account is now connected to HRM_OPS for phone <b>${rawContactPhone}</b>.\n\nWhenever you log in to HRM_OPS, your 6-digit verification code will be sent right here instantly.`
        : `✅ <b>Telegram Linked!</b>\n\nYour Telegram is registered for phone <b>${rawContactPhone}</b>.\n\nOnce your account is active, your login verification codes will be delivered directly here.`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: replyText,
          parse_mode: "HTML",
          reply_markup: {
            remove_keyboard: true,
          },
        }),
      });

      return json({ ok: true });
    }

    // 2. User typed /start or any text in private chat
    if (message.text) {
      const welcomeText = `👋 <b>Welcome to HRM_OPS Verification!</b>\n\nTo receive your login verification codes here for free, please tap the button below to link your phone number.`;

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcomeText,
          parse_mode: "HTML",
          reply_markup: {
            keyboard: [
              [{ text: "📱 Connect My Phone Number", request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        }),
      });

      return json({ ok: true });
    }

    return json({ ok: true });
  } catch (err: unknown) {
    console.error("[telegram-bot] error:", err);
    return json({ error: String(err) }, 500);
  }
});
