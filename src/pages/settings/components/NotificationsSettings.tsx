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
  const [testingTelegram, setTestingTelegram] = useState(false);

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      await sendTelegramMessage(
        "🧪 <b>Test message</b>\nTelegram notifications are connected to HR Nexus."
      );
      toast("Sent", "Test message posted to the Telegram group.", "success");
    } catch (err: any) {
      toast(
        "Error",
        err?.message || "Failed to send Telegram test message.",
        "error"
      );
    } finally {
      setTestingTelegram(false);
    }
  };

  const notifKeys = notificationKeys.map((n) => n.key);

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-semibold text-gray-700">
          Configure which events trigger email and push notifications
        </p>
        {hasChanges(notifKeys) && (
          <button
            onClick={saveAllNotifications}
            disabled={saving}
            className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {saving ? "Saving..." : "Save All"}
          </button>
        )}
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
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
              className="grid grid-cols-3 px-5 py-3.5 border-t border-gray-50 items-center"
            >
              <span className="text-[13px] text-gray-700">{label}</span>
              <div className="flex justify-center">
                <label className="flex items-center gap-1.5 text-[12px] text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={getVal(emailKey) === "true"}
                    onChange={(e) =>
                      updateValue(emailKey, String(e.target.checked))
                    }
                    className="w-4 h-4 rounded border-gray-300 text-[#253C7D]"
                  />
                  Email
                </label>
              </div>
              <div className="flex justify-center">
                <label className="flex items-center gap-1.5 text-[12px] text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={getVal(pushKey) === "true"}
                    onChange={(e) =>
                      updateValue(pushKey, String(e.target.checked))
                    }
                    className="w-4 h-4 rounded border-gray-300 text-[#253C7D]"
                  />
                  Push
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance notify scope */}
      <div className="border border-gray-100 rounded-xl p-5">
        <label className="text-[13px] font-semibold text-gray-700">
          Attendance check-in / check-out notifications
        </label>
        <p className="text-[11px] text-gray-500 mt-0.5 mb-3">
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
            className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D]"
          >
            <option value="exceptions">
              Only late check-ins / early check-outs
            </option>
            <option value="all">Every check-in and check-out</option>
          </select>
        </div>
      </div>

      {/* Telegram notifications */}
      <div className="border border-gray-100 rounded-xl p-5">
        <label className="text-[13px] font-semibold text-gray-700">
          Telegram group notifications
        </label>
        <p className="text-[11px] text-gray-500 mt-0.5 mb-3">
          Posts HR events to a Telegram group: attendance exceptions only (late
          check-in, early checkout — never routine on-time events, regardless of
          the scope setting above), leave requests and approvals, meeting room
          bookings, and new announcements. Requires TELEGRAM_BOT_TOKEN and
          TELEGRAM_CHAT_ID to be set as secrets on the send-telegram-notification
          Edge Function.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 text-[12px] text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={getVal("telegram_notify_enabled") === "true"}
              onChange={(e) =>
                updateValue(
                  "telegram_notify_enabled",
                  String(e.target.checked)
                )
              }
              className="w-4 h-4 rounded border-gray-300 text-[#253C7D]"
            />
            Enabled
          </label>
          <button
            onClick={handleTestTelegram}
            disabled={testingTelegram}
            className="ml-auto px-4 py-2 border-2 border-gray-200 text-gray-600 text-[12px] font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 whitespace-nowrap"
          >
            {testingTelegram ? "Sending…" : "Send test message"}
          </button>
        </div>
      </div>
    </div>
  );
}
