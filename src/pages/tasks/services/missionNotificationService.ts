import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import { resolveUserIdForEmployee } from "@/pages/hire/services/notifications/recruitmentRecipients";

export interface MissionEmployeeInfo {
  id: string;
  first_name: string;
  last_name: string;
  role?: string | null;
  department?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface MissionNotificationPayload {
  missionTitle: string;
  missionType?: string;
  missionFor?: string;
  priority?: string;
  fromDate?: string;
  toDate?: string;
  totalDays?: number;
  location?: string | null;
  detail?: string;
  remark?: string;
  primaryEmployee: MissionEmployeeInfo;
  teamMembers?: MissionEmployeeInfo[];
  taskId?: string | null;
}

export async function notifyMissionInvitation(payload: MissionNotificationPayload) {
  const {
    missionTitle,
    missionType = "Official Mission",
    missionFor = "daily",
    priority = "high",
    fromDate,
    toDate,
    totalDays,
    location,
    detail,
    remark,
    primaryEmployee,
    teamMembers = [],
    taskId,
  } = payload;

  const leadName = `${primaryEmployee.first_name} ${primaryEmployee.last_name}`.trim();
  const teamList = teamMembers.length
    ? teamMembers.map((m) => `${m.first_name} ${m.last_name}`.trim()).join(", ")
    : null;

  // 1. Send notification to the Telegram notification group
  try {
    const lines = [
      `🚗 <b>New Mission / Outside Work Assignment</b>`,
      "",
      `📋 <b>Subject:</b> ${escapeTelegramHtml(missionTitle)}`,
      `📌 <b>Type:</b> ${escapeTelegramHtml(missionType)} (${escapeTelegramHtml(missionFor.toUpperCase())})`,
      `⚡ <b>Priority:</b> ${escapeTelegramHtml(priority.toUpperCase())}`,
      `👤 <b>Field Lead:</b> ${escapeTelegramHtml(leadName)} (${escapeTelegramHtml(primaryEmployee.department || "Operations")})`,
    ];

    if (teamList) {
      lines.push(`👥 <b>Team Members:</b> ${escapeTelegramHtml(teamList)}`);
    }
    if (fromDate) {
      const schedule = fromDate === toDate || !toDate ? fromDate : `${fromDate} → ${toDate}`;
      const daysNote = totalDays ? ` (${totalDays} day${totalDays > 1 ? "s" : ""})` : "";
      lines.push(`📅 <b>Schedule:</b> ${schedule}${daysNote}`);
    }
    if (location?.trim()) {
      lines.push(`📍 <b>Location:</b> ${escapeTelegramHtml(location.trim())}`);
    }
    if (detail?.trim()) {
      lines.push(`📝 <b>Detail:</b> ${escapeTelegramHtml(detail.trim().slice(0, 180))}`);
    }
    if (remark?.trim()) {
      lines.push(`💬 <b>Remark:</b> ${escapeTelegramHtml(remark.trim().slice(0, 120))}`);
    }

    await notifyTelegramEvent(lines.join("\n"), {
      text: "View in HR Tasks",
      url: hrNexusUrl("/tasks"),
    });
  } catch (err) {
    console.warn("Failed to dispatch mission Telegram notification:", err);
  }

  // 2. Send system notification to employee accounts if they have an active user account
  const allEmployees = [primaryEmployee, ...teamMembers];
  const uniqueEmployees = Array.from(new Map(allEmployees.map((e) => [e.id, e])).values());

  await Promise.allSettled(
    uniqueEmployees.map(async (emp) => {
      try {
        const userId = await resolveUserIdForEmployee({
          employeeId: emp.id,
          email: emp.email,
          phone: emp.phone,
          name: `${emp.first_name} ${emp.last_name}`.trim(),
        });

        if (userId) {
          await notify({
            recipientUserId: userId,
            source: "tasks",
            type: "info",
            title: "Mission / Outside Work Assignment",
            message: `You have been assigned to: "${missionTitle}" (${missionType}). Schedule: ${fromDate || "today"}.`,
            entityId: taskId || null,
            skipTelegram: true,
          });
        }
      } catch (err) {
        console.warn(`Could not send system notification to employee ${emp.id}:`, err);
      }
    })
  );
}
