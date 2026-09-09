import { useState } from "react";
import { toast } from "@/components/Toast";
import { sendTelegramMessage } from "@/lib/telegramNotify";
import { notificationKeys, EVENT_LABELS } from "../constants";

interface NotificationsSettingsProps {
  getVal: (key: string) => string;
  updateValue: (key: string, value: string) => void;
  saveSetting: (key: string) => Promise<void>;
  hasChanges: (keys: string[]) => boolean;
  saveAllNotifications: () => Promise<void>;
  saving: boolean;
  edited: Record<string, string>;
}

export function NotificationsSettings({
  getVal,
  updateValue,
  saveSetting,
  hasChanges,
  saveAllNotifications,
  saving,
  edited,
}: NotificationsSettingsProps) {
  const [testingNotifTelegram, setTestingNotifTelegram] = useState(false);
  const [testingOtpTelegram, setTestingOtpTelegram] = useState(false);

  const handleTestNotifications = async () => {
    setTestingNotifTelegram(true);
    try {
      const chatId = getVal("telegram_notifications_chat_id") || undefined;
      await sendTelegramMessage(
        "📢 <b>HRM_OPS Notifications Test</b>\n\nUser action notifications (attendance, leave requests, employee updates, meeting rooms, etc.) are connected successfully!",
        undefined,
        chatId
      );
      toast("Sent", "Test notification posted to the Notifications Telegram group.", "success");
    } catch (err: any) {
      toast(
        "Error",
        err?.message || "Failed to send Telegram test message. Make sure the bot is in the group and /set_notifications has been run.",
        "error"
      );
    } finally {
      setTestingNotifTelegram(false);
    }
  };

  const handleTestOtp = async () => {
    setTestingOtpTelegram(true);
    try {
      const chatId = getVal("telegram_otp_chat_id") || "-5356924617";
      await sendTelegramMessage(
        "🔐 <b>HRMsystem OTP Test</b>\n\nThis group is configured exclusively for login OTP codes.\nYour test verification code is: <code>123456</code>",
        undefined,
        chatId
      );
      toast("Sent", "Test OTP posted to the OTP Telegram group.", "success");
    } catch (err: any) {
      toast(
        "Error",
        err?.message || "Failed to send test OTP to Telegram group.",
        "error"
      );
    } finally {
      setTestingOtpTelegram(false);
    }
  };

  const notifKeys = [
    ...notificationKeys.map((n) => n.key),
    "telegram_notify_enabled",
    "telegram_notifications_chat_id",
    "telegram_otp_chat_id",
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-semibold text-gray-700 dark:text-slate-200">
          Configure which events trigger email and push notifications
        </p>
        {hasChanges(notifKeys) && (
          <button
            onClick={saveAllNotifications}
            disabled={saving}
            className="px-4 py-2 bg-[#253C7D] dark:bg-blue-600 text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] dark:hover:bg-blue-700 transition-colors disabled:opacity-40 whitespace-nowrap cursor-pointer"
          >
            {saving ? "Saving..." : "Save All"}
          </button>
        )}
      </div>

      <div className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 bg-gray-50 dark:bg-slate-800/80 px-5 py-3 text-[11px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
          <span>Event</span>
          <span className="text-center">Email</span>
          <span className="text-center">Push</span>
        </div>
        {EVENT_LABELS.map((label) => {
          const emailKey =
            notificationKeys.find(
              (n) => n.label === label && n.channel === "email"
            )?.key || "";
          const pushKey =
            notificationKeys.find(
              (n) => n.label === label && n.channel === "push"
            )?.key || "";
          return (
            <div
              key={label}
              className="grid grid-cols-3 px-5 py-3.5 border-t border-gray-50 dark:border-slate-800 items-center dark:bg-slate-900/60"
            >
              <span className="text-[13px] text-gray-700 dark:text-slate-200">{label}</span>
              <div className="flex justify-center">
                <label className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={getVal(emailKey) === "true"}
                    onChange={(e) =>
                      updateValue(emailKey, String(e.target.checked))
                    }
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-[#253C7D] accent-[#253C7D] cursor-pointer"
                  />
                  Email
                </label>
              </div>
              <div className="flex justify-center">
                <label className="flex items-center gap-1.5 text-[12px] text-gray-500 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={getVal(pushKey) === "true"}
                    onChange={(e) =>
                      updateValue(pushKey, String(e.target.checked))
                    }
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-[#253C7D] accent-[#253C7D] cursor-pointer"
                  />
                  Push
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance notify scope */}
      <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-5 dark:bg-slate-900/60">
        <label className="text-[13px] font-semibold text-gray-700 dark:text-slate-200">
          Attendance check-in / check-out notifications
        </label>
        <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 mb-3">
          Who receives these is set per-role in Admin Portal → Roles ("Receives
          attendance check-in / check-out notifications"). This controls how
          often they fire for whoever is opted in.
        </p>
        <div className="flex gap-2">
          <select
            value={getVal("attendance_notify_scope") || "exceptions"}
            onChange={(e) =>
              updateValue("attendance_notify_scope", e.target.value)
            }
            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-lg text-[13px] text-gray-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] dark:focus:border-blue-500"
          >
            <option value="exceptions" className="dark:bg-slate-800">
              Only late check-ins / early check-outs
            </option>
            <option value="all" className="dark:bg-slate-800">Every check-in and check-out</option>
          </select>
        </div>
      </div>

      {/* Telegram channels */}
      <div className="border border-gray-100 dark:border-slate-800 rounded-xl p-5 dark:bg-slate-900/60 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <label className="text-[13px] font-semibold text-gray-700 dark:text-slate-200">
              Telegram Channels & Bot Routing
            </label>
            <label className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={getVal("telegram_notify_enabled") === "true"}
                onChange={(e) =>
                  updateValue(
                    "telegram_notify_enabled",
                    String(e.target.checked)
                  )
                }
                className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-[#253C7D] accent-[#253C7D] cursor-pointer"
              />
              Enable Telegram Integration
            </label>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
            Routes system events and login OTP codes to dedicated Telegram groups via @HRM_OPS_bot.
          </p>
        </div>

        {/* Channel 1: Action Notifications Group */}
        <div className="bg-gray-50/80 dark:bg-slate-800/60 rounded-lg p-4 border border-gray-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📢</span>
              <div>
                <span className="text-[12px] font-semibold text-gray-800 dark:text-slate-200">
                  User Actions & System Notifications
                </span>
                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded font-medium">
                  HRM_OPS_Notifications
                </span>
              </div>
            </div>
            <button
              onClick={handleTestNotifications}
              disabled={testingNotifTelegram || getVal("telegram_notify_enabled") !== "true"}
              className="px-3 py-1.5 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              {testingNotifTelegram ? "Sending…" : "Send test notification"}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            Receives all non-OTP actions: employee updates, attendance, leave requests/approvals, onboarding milestones, tasks, and meeting rooms.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. -1001234567890 (auto-filled when typing in group)"
              value={getVal("telegram_notifications_chat_id")}
              onChange={(e) => updateValue("telegram_notifications_chat_id", e.target.value.trim())}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-[12px] text-gray-900 dark:text-slate-100 font-mono focus:outline-none focus:border-[#253C7D] dark:focus:border-blue-500"
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            💡 Quick setup: In your <b className="text-gray-600 dark:text-slate-300">HRM_OPS_Notifications</b> group with @HRM_OPS_bot, type <code className="bg-gray-200 dark:bg-slate-700 px-1 rounded">/set_notifications</code> or send any message to auto-link this group.
          </p>
        </div>

        {/* Channel 2: OTP Bot Group */}
        <div className="bg-gray-50/80 dark:bg-slate-800/60 rounded-lg p-4 border border-gray-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🔐</span>
              <div>
                <span className="text-[12px] font-semibold text-gray-800 dark:text-slate-200">
                  Login OTP Verification Codes
                </span>
                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded font-medium">
                  HRMsystem_OTP_code
                </span>
              </div>
            </div>
            <button
              onClick={handleTestOtp}
              disabled={testingOtpTelegram}
              className="px-3 py-1.5 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              {testingOtpTelegram ? "Sending…" : "Send test OTP"}
            </button>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            Reserved exclusively for 6-digit phone login OTP codes. Action notifications will never be sent here.
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="-5356924617"
              value={getVal("telegram_otp_chat_id") || "-5356924617"}
              onChange={(e) => updateValue("telegram_otp_chat_id", e.target.value.trim())}
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-[12px] text-gray-900 dark:text-slate-100 font-mono focus:outline-none focus:border-[#253C7D] dark:focus:border-blue-500"
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            💡 Connected to group ID: <code className="bg-gray-200 dark:bg-slate-700 px-1 rounded">{getVal("telegram_otp_chat_id") || "-5356924617"}</code> (HRMsystem_OTP_code). Type <code className="bg-gray-200 dark:bg-slate-700 px-1 rounded">/set_otp</code> in the group anytime to re-verify.
          </p>
        </div>
      </div>
    </div>
  );
}
