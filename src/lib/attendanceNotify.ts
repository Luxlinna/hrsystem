import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import { sendTelegramMessage } from "@/lib/telegramNotify";

interface AttendanceNotifyInput {
  employeeName: string;
  employeeId: string;
  type: "in" | "out";
  isException: boolean;
  exceptionMinutes?: number;
  // Optional extra detail folded into the Telegram card only — the in-app
  // notification row doesn't have room for it and doesn't need it, since
  // clicking that row already opens the record.
  date?: string; // "YYYY-MM-DD"
  time?: string; // "HH:MM" or "HH:MM:SS", company-timezone wall clock
  branchName?: string;
  department?: string;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDateLabel(ymd?: string): string | null {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

function formatTimeLabel(hms?: string): string | null {
  if (!hms) return null;
  const [h, m] = hms.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// Who receives the in-app notifications (per-role opt-in) and how often
// they fire (every clock event vs. only late/early exceptions) are both
// admin-configurable — see migration
// 20260821000000_attendance_checkin_notifications.sql, the "Receives
// attendance check-in / check-out notifications" role toggle in Admin
// Portal, and the scope select in Settings -> Notifications.
//
// Telegram (20260827000000_add_telegram_notifications.sql,
// telegram_notify_enabled) is intentionally NOT tied to that scope setting
// — it only ever posts for exceptions (late check-in / early checkout),
// regardless of whether the in-app scope is set to "all". The Telegram
// group is meant to flag problems, not mirror every routine check-in.
export async function notifyAttendanceEvent(input: AttendanceNotifyInput) {
  const { data: settingRows } = await supabase
    .from("system_settings")
    .select("key, value")
    .in("key", ["attendance_notify_scope", "telegram_notify_enabled"]);
  const settingsMap = Object.fromEntries((settingRows || []).map((r: any) => [r.key, r.value]));

  const inAppScope = settingsMap.attendance_notify_scope === "all" ? "all" : "exceptions";
  const wantsInApp = inAppScope === "all" || input.isException;
  const wantsTelegram = input.isException && settingsMap.telegram_notify_enabled === "true";
  if (!wantsInApp && !wantsTelegram) return;

  const action = input.type === "in" ? "checked in" : "checked out";
  const exceptionNote =
    input.isException && input.exceptionMinutes
      ? input.type === "in"
        ? ` (${input.exceptionMinutes} min late)`
        : ` (${input.exceptionMinutes} min early)`
      : "";
  const title = input.type === "in" ? "Employee checked in" : "Employee checked out";
  const message = `${input.employeeName} ${action}${exceptionNote}.`;

  if (wantsInApp) {
    const { data: roles } = await supabase.from("app_roles").select("id").eq("attendance_notify", true);
    const roleIds = (roles || []).map((r: any) => r.id);
    if (roleIds.length > 0) {
      const { data: assignments } = await supabase
        .from("user_role_assignments")
        .select("user_id")
        .in("role_id", roleIds);
      const userIds = Array.from(new Set((assignments || []).map((a: any) => a.user_id).filter(Boolean)));

      await Promise.all(
        userIds.map((uid) =>
          notify({
            source: "attendance",
            type: input.isException ? "warning" : "info",
            title,
            message,
            entityId: input.employeeId,
            recipientUserId: uid,
          })
        )
      );
    }
  }

  if (wantsTelegram) {
    // wantsTelegram implies input.isException — Telegram only ever fires
    // for late check-ins / early checkouts, never routine on-time events.
    const label = input.type === "in" ? "Late Check-in" : "Early Checkout";
    const emoji = input.type === "in" ? "⏰" : "⚠️";

    const lines = [`${emoji} <b>${label}</b>`, "", `👤 <b>Employee:</b> ${escapeHtml(input.employeeName)}`];
    const dateLabel = formatDateLabel(input.date);
    const timeLabel = formatTimeLabel(input.time);
    if (dateLabel) lines.push(`📅 <b>Date:</b> ${dateLabel}`);
    if (timeLabel) lines.push(`🕒 <b>Time:</b> ${timeLabel}`);
    if (input.department) lines.push(`🗂 <b>Department:</b> ${escapeHtml(input.department)}`);
    if (input.branchName) lines.push(`🏢 <b>Branch:</b> ${escapeHtml(input.branchName)}`);
    lines.push(
      `⚠️ <b>Status:</b> ${input.exceptionMinutes ?? 0} min ${input.type === "in" ? "late" : "early"}`
    );

    const appUrl = (import.meta.env.VITE_APP_URL || "https://hrsystem-quit.onrender.com").replace(/\/$/, "");
    // Fire-and-forget: a Telegram outage shouldn't block the clock-in/out flow.
    sendTelegramMessage(lines.join("\n"), { text: "Open in HR Nexus", url: `${appUrl}/attendance` }).catch((err) =>
      console.warn("Telegram attendance notify failed:", err)
    );
  }
}
