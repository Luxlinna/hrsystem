import { useState } from "react";
import { toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import { sendTelegramMessage } from "@/lib/telegramNotify";
import {
  ALERT_SOUND_OPTIONS,
  type AlertSoundType,
  getStoredAlertSound,
  setStoredAlertSound,
  getStoredAlertVolume,
  setStoredAlertVolume,
  playAnnouncementAlertSound,
} from "@/lib/alertSounds";
import {
  ANNOUNCEMENT_PRIORITY_TIERS,
  type AnnouncementPriorityTier,
  getStoredAlertIntervalSeconds,
  setStoredAlertIntervalSeconds,
} from "@/lib/announcementAlertTypes";
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
  const [testingDeviceTelegram, setTestingDeviceTelegram] = useState(false);
  const [togglingTelegramOtp, setTogglingTelegramOtp] = useState(false);

  const handleToggleTelegramOtp = async (enabled: boolean) => {
    const val = enabled ? "true" : "false";
    updateValue("telegram_otp_enabled", val);
    setTogglingTelegramOtp(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert(
          {
            key: "telegram_otp_enabled",
            value: val,
            type: "boolean",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );

      if (error) throw error;

      toast(
        enabled ? "Telegram OTP Enabled" : "Telegram OTP Disabled",
        enabled
          ? "Employees signing in with a phone number will receive a 6-digit code via Telegram bot."
          : "Phone number OTP is now OFF. Employees signing in with a phone number will log in directly without OTP.",
        "success"
      );

      logActivity({
        module: "settings",
        action: "updated",
        entityType: "system_setting",
        entityId: null,
        actorName: "Admin",
        actorRole: "admin",
        description: `Phone Number OTP via Telegram Bot ${enabled ? "enabled" : "disabled"}`,
      });
    } catch (err: any) {
      updateValue("telegram_otp_enabled", enabled ? "false" : "true");
      toast("Error", err?.message || "Failed to update Telegram OTP setting.", "error");
    } finally {
      setTogglingTelegramOtp(false);
    }
  };

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

  const handleTestDeviceAlert = async () => {
    setTestingDeviceTelegram(true);
    try {
      const chatId = getVal("telegram_notifications_chat_id") || undefined;
      const threshold = getVal("biometric_offline_threshold_minutes") || "60";
      await sendTelegramMessage(
        `⚠️ <b>Biometric Device Offline Alert (TEST)</b>\n\n📍 <b>Location / Branch:</b> Kampong Thom (Pinex Agro)\n📟 <b>Device:</b> MB460 Plus - Kampong Thom (<code>TTQ5255000213</code>)\n🕒 <b>Last Heartbeat:</b> ${threshold} mins ago\n\n🔴 <b>Action Required:</b>\n• Check power to the ZKTeco terminal and 4G router.\n• Verify the Huawei router has 4G SIM mobile credit/data.\n• Ensure the Ethernet cable is connected tightly.\n\n💡 <i>This is a test notification. Real alerts fire automatically when a machine stops heartbeating for >${threshold} mins during working hours (06:00 – 19:00).</i>`,
        undefined,
        chatId
      );
      toast("Sent", "Test device alert posted to the Notifications Telegram group.", "success");
    } catch (err: any) {
      toast(
        "Error",
        err?.message || "Failed to send Telegram test alert.",
        "error"
      );
    } finally {
      setTestingDeviceTelegram(false);
    }
  };

  const notifKeys = [
    ...notificationKeys.map((n) => n.key),
    "telegram_notify_enabled",
    "telegram_otp_enabled",
    "telegram_notifications_chat_id",
    "telegram_otp_chat_id",
    "biometric_offline_alert_enabled",
    "biometric_offline_threshold_minutes",
  ];

  const telegramKeys = [
    "telegram_notify_enabled",
    "telegram_otp_enabled",
    "telegram_notifications_chat_id",
    "telegram_otp_chat_id",
    "biometric_offline_alert_enabled",
    "biometric_offline_threshold_minutes",
  ];

  return (
    <div className="w-full space-y-8">
      {/* Section 1: Event Notification Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Event Notifications</h3>
          </div>
          {hasChanges(notifKeys) && (
            <button
              onClick={saveAllNotifications}
              disabled={saving}
              className="px-4 py-2 bg-[#253C7D] dark:bg-blue-600 hover:bg-[#1d3064] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          )}
        </div>

        <div className="border border-slate-200/70 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          <div className="grid grid-cols-12 bg-slate-50/90 dark:bg-slate-800/80 px-4 py-2.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <span className="col-span-8">Event Trigger</span>
            <span className="col-span-2 text-center">Email</span>
            <span className="col-span-2 text-center">Push / In-App</span>
          </div>
          {EVENT_LABELS.map((label) => {
            const emailKey = notificationKeys.find((n) => n.label === label && n.channel === "email")?.key || "";
            const pushKey = notificationKeys.find((n) => n.label === label && n.channel === "push")?.key || "";
            return (
              <div
                key={label}
                className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <span className="col-span-8 text-xs font-semibold text-slate-800 dark:text-slate-200">{label}</span>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={getVal(emailKey) === "true"}
                    onChange={(e) => updateValue(emailKey, String(e.target.checked))}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#253C7D] accent-[#253C7D] cursor-pointer"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <input
                    type="checkbox"
                    checked={getVal(pushKey) === "true"}
                    onChange={(e) => updateValue(pushKey, String(e.target.checked))}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#253C7D] accent-[#253C7D] cursor-pointer"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Attendance frequency policy */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Attendance Alerts Filter</span>
          <select
            value={getVal("attendance_notify_scope") || "exceptions"}
            onChange={(e) => updateValue("attendance_notify_scope", e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="exceptions">Only late check-ins &amp; early check-outs</option>
            <option value="all">Every check-in and check-out</option>
          </select>
        </div>
      </div>

      {/* Section 2: Telegram Channels & Bot Routing */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#229ED9] flex items-center justify-center text-lg shrink-0">
              <i className="ri-telegram-fill" />
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Telegram Bot &amp; Group Routing</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges(telegramKeys) && (
              <button
                type="button"
                onClick={saveAllNotifications}
                disabled={saving}
                className="px-3.5 py-1.5 bg-[#253C7D] dark:bg-blue-600 hover:bg-[#1d3064] text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-save-line" />
                <span>{saving ? "Saving..." : "Save Telegram Settings"}</span>
              </button>
            )}
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <input
                type="checkbox"
                checked={getVal("telegram_notify_enabled") === "true"}
                onChange={(e) => updateValue("telegram_notify_enabled", String(e.target.checked))}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#253C7D] accent-[#253C7D] cursor-pointer"
              />
              <span>System Alerts</span>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          {/* Channel 1: Action Notifications Group */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  User Actions &amp; System Notifications Group
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  HRM_OPS_Notifications
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestNotifications}
                disabled={testingNotifTelegram || getVal("telegram_notify_enabled") !== "true"}
                className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-send-plane-line text-xs text-[#253C7D] dark:text-blue-400" />
                <span>{testingNotifTelegram ? "Sending..." : "Test Group Alert"}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Telegram Group Chat ID (e.g. -5314130569)"
                value={getVal("telegram_notifications_chat_id")}
                onChange={(e) => updateValue("telegram_notifications_chat_id", e.target.value.trim())}
                className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Channel 2: OTP Group */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Phone Number OTP via Telegram Bot
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                    getVal("telegram_otp_enabled") !== "false"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-900"
                  }`}
                >
                  {getVal("telegram_otp_enabled") !== "false" ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <label className={`flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs ${togglingTelegramOtp ? "opacity-60 pointer-events-none" : ""}`}>
                  <input
                    type="checkbox"
                    disabled={togglingTelegramOtp}
                    checked={getVal("telegram_otp_enabled") !== "false"}
                    onChange={(e) => handleToggleTelegramOtp(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#253C7D] accent-[#253C7D] cursor-pointer"
                  />
                  <span>{togglingTelegramOtp ? "Saving..." : getVal("telegram_otp_enabled") !== "false" ? "Enabled" : "Disabled"}</span>
                </label>

                <button
                  type="button"
                  onClick={handleTestOtp}
                  disabled={testingOtpTelegram || getVal("telegram_otp_enabled") === "false"}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-key-2-line text-xs text-amber-600" />
                  <span>{testingOtpTelegram ? "Sending..." : "Test OTP Code"}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="OTP Telegram Group ID (e.g. -5356924617)"
                value={getVal("telegram_otp_chat_id") || "-5356924617"}
                onChange={(e) => updateValue("telegram_otp_chat_id", e.target.value.trim())}
                disabled={getVal("telegram_otp_enabled") === "false"}
                className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] disabled:opacity-50"
              />
            </div>
          </div>

          {/* Channel 3: Biometric Terminal Inactive Watcher */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Biometric Terminal Offline Monitoring
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                  ZKTeco ADMS
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestDeviceAlert}
                disabled={testingDeviceTelegram || getVal("telegram_notify_enabled") !== "true"}
                className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-hard-drive-2-line text-xs text-emerald-600" />
                <span>{testingDeviceTelegram ? "Sending..." : "Test Device Offline Alert"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <input
                  type="checkbox"
                  checked={getVal("biometric_offline_alert_enabled") !== "false"}
                  onChange={(e) => updateValue("biometric_offline_alert_enabled", String(e.target.checked))}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-[#253C7D] accent-[#253C7D] cursor-pointer"
                />
                <span>Enable Terminal Offline Telegram Alerts</span>
              </label>

              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Alert after inactive:</span>
                <select
                  value={getVal("biometric_offline_threshold_minutes") || "60"}
                  onChange={(e) => updateValue("biometric_offline_threshold_minutes", e.target.value)}
                  className="flex-1 bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
                >
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes (Standard)</option>
                  <option value="90">90 minutes</option>
                  <option value="120">120 minutes (2h)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Announcement Alert Severity & Sound Rules */}
      <AnnouncementAlertSoundSettingsCard
        getVal={getVal}
        updateValue={updateValue}
      />
    </div>
  );
}

function AnnouncementAlertSoundSettingsCard({
  getVal,
  updateValue,
}: {
  getVal: (key: string) => string;
  updateValue: (key: string, value: string) => void;
}) {
  const [activeTier, setActiveTier] = useState<AnnouncementPriorityTier>("urgent");

  const currentSound = (getVal("announcement_alert_sound") || getStoredAlertSound()) as AlertSoundType;
  const currentVol = Number(getVal("announcement_alert_volume") || getStoredAlertVolume());
  const currentIntervalSec = Number(getVal("announcement_alert_interval_sec") || getStoredAlertIntervalSeconds());
  const [intervalUnit, setIntervalUnit] = useState<"seconds" | "minutes">(
    currentIntervalSec >= 60 && currentIntervalSec % 60 === 0 ? "minutes" : "seconds"
  );

  const handleIntervalChange = (sec: number) => {
    updateValue("announcement_alert_interval_sec", String(sec));
    setStoredAlertIntervalSeconds(sec);
  };

  const handleSelectSound = (soundId: AlertSoundType) => {
    updateValue("announcement_alert_sound", soundId);
    setStoredAlertSound(soundId);
    playAnnouncementAlertSound(soundId, currentVol);
  };

  const handleVolumeChange = (vol: number) => {
    updateValue("announcement_alert_volume", String(vol));
    setStoredAlertVolume(vol);
  };

  const handleTestCurrentSound = () => {
    playAnnouncementAlertSound(currentSound, currentVol);
    toast("Playing Sample", `Previewing "${ALERT_SOUND_OPTIONS.find((s) => s.id === currentSound)?.label}"`, "info");
  };

  const currentTierConfig = ANNOUNCEMENT_PRIORITY_TIERS.find((t) => t.id === activeTier) || ANNOUNCEMENT_PRIORITY_TIERS[2];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-[#253C7D]/10 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-400 flex items-center justify-center text-base shrink-0 font-bold">
            <i className="ri-notification-3-line" />
          </span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Announcement Alert Rules &amp; Audio Tone
          </h3>
        </div>

        {/* Severity Tier Selector Tabs */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700">
          {ANNOUNCEMENT_PRIORITY_TIERS.map((tier) => {
            const isSelected = activeTier === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => setActiveTier(tier.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${tier.dotColor}`} />
                <span>{tier.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier Details Body */}
      <div className="p-6 space-y-6">
        {/* Tier Info Card */}
        <div className="p-3 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm shrink-0">
              <i className={activeTier === "urgent" ? "ri-alarm-warning-line text-rose-600" : activeTier === "priority" ? "ri-flashlight-line text-amber-600" : "ri-information-line text-blue-600"} />
            </span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {currentTierConfig.label}
            </span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${
            activeTier === "urgent"
              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300"
              : activeTier === "priority"
              ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300"
              : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300"
          }`}>
            {activeTier === "urgent" ? "Mandatory Acknowledgment" : "Optional Informational"}
          </span>
        </div>

        {/* ── NORMAL TIER SETTINGS ── */}
        {activeTier === "normal" && (
          <div className="bg-slate-50/70 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <i className="ri-volume-mute-line text-slate-400" />
              Audio Chime &amp; Screen Interruptions
            </span>
            <span className="font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
              Silent Feed Only
            </span>
          </div>
        )}

        {/* ── PRIORITY TIER SETTINGS ── */}
        {activeTier === "priority" && (
          <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 p-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Audio Tone
            </span>
            <button
              type="button"
              onClick={() => playAnnouncementAlertSound("bell")}
              className="text-xs font-bold text-[#253C7D] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <i className="ri-play-circle-line" />
              <span>Crystal Bell</span>
            </button>
          </div>
        )}

        {/* ── URGENT TIER SETTINGS ── */}
        {activeTier === "urgent" && (
          <div className="space-y-6">

            {/* Reminder Interval Input */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                  Reminder Interval (Repeat Until Acknowledged)
                </span>

                {/* Unit Switcher */}
                <div className="flex items-center bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (currentIntervalSec === 0) handleIntervalChange(30);
                      else if (intervalUnit === "minutes") handleIntervalChange(Math.max(5, Math.round(currentIntervalSec)));
                      setIntervalUnit("seconds");
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      intervalUnit === "seconds" && currentIntervalSec > 0
                        ? "bg-[#253C7D] dark:bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    Seconds
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (currentIntervalSec === 0) handleIntervalChange(60);
                      setIntervalUnit("minutes");
                    }}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      intervalUnit === "minutes" && currentIntervalSec > 0
                        ? "bg-[#253C7D] dark:bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    Minutes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIntervalChange(0)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                      currentIntervalSec === 0
                        ? "bg-[#253C7D] dark:bg-blue-600 text-white shadow-2xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
                    }`}
                  >
                    Once Only
                  </button>
                </div>
              </div>

              {/* Input Field + Presets */}
              {currentIntervalSec > 0 ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 w-full sm:w-56 shadow-2xs">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">Every</span>
                    <input
                      type="number"
                      min={intervalUnit === "seconds" ? 5 : 1}
                      max={intervalUnit === "seconds" ? 3600 : 60}
                      value={intervalUnit === "minutes" ? Math.max(1, Math.round(currentIntervalSec / 60)) : currentIntervalSec}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (intervalUnit === "minutes") {
                          handleIntervalChange(Math.max(1, val) * 60);
                        } else {
                          handleIntervalChange(Math.max(5, val));
                        }
                      }}
                      className="w-full text-sm font-bold text-slate-900 dark:text-white bg-transparent focus:outline-none"
                    />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                      {intervalUnit === "minutes" ? "min(s)" : "sec(s)"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: "15s", sec: 15 },
                      { label: "30s", sec: 30 },
                      { label: "45s", sec: 45 },
                      { label: "1m", sec: 60 },
                      { label: "2m", sec: 120 },
                      { label: "5m", sec: 300 },
                      { label: "10m", sec: 600 },
                    ].map((preset) => {
                      const isSelected = currentIntervalSec === preset.sec;
                      return (
                        <button
                          key={preset.sec}
                          type="button"
                          onClick={() => {
                            setIntervalUnit(preset.sec >= 60 ? "minutes" : "seconds");
                            handleIntervalChange(preset.sec);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            isSelected
                              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xs"
                              : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <i className="ri-notification-off-line text-slate-400" />
                  <span>Alert will only be triggered once upon publication.</span>
                </div>
              )}
            </div>

            {/* 3. Audio Tone Selector */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  Urgent Audio Alert Tone
                </label>
                <button
                  type="button"
                  onClick={handleTestCurrentSound}
                  disabled={currentSound === "mute"}
                  className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-play-circle-line text-xs text-[#253C7D] dark:text-blue-400" />
                  <span>Test Tone</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {ALERT_SOUND_OPTIONS.map((sound) => {
                  const isSelected = currentSound === sound.id;
                  return (
                    <button
                      key={sound.id}
                      type="button"
                      onClick={() => handleSelectSound(sound.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? "bg-white dark:bg-slate-800 border-[#253C7D] dark:border-blue-500 shadow-xs ring-2 ring-[#253C7D]/10 dark:ring-blue-500/20"
                          : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                        isSelected
                          ? "bg-[#253C7D] dark:bg-blue-600 text-white"
                          : "bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}>
                        <i className={sound.icon} />
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {sound.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Volume Slider */}
            {currentSound !== "mute" && (
              <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <i className="ri-volume-down-line text-slate-400 text-sm" />
                    Chime Volume:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    {Math.round(currentVol * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={currentVol}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#253C7D] dark:accent-blue-500"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
