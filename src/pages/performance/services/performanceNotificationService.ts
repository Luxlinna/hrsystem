import { notify } from "@/lib/notify";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { Employee } from "../types";

interface SelfAssessmentNotifyParams {
  reviewId?: string;
  employee?: Employee | null;
  evaluator?: Employee | null;
  selfScore: number;
  quarter: string;
  year: number;
  reflection: string;
  branchId?: string | null;
}

interface EvaluationCompletedNotifyParams {
  reviewId?: string;
  employee?: Employee | null;
  evaluator?: Employee | null;
  overallScore: number;
  quarter: string;
  year: number;
  comments: string;
  branchId?: string | null;
}

export async function notifySelfAssessmentSubmitted(params: SelfAssessmentNotifyParams): Promise<void> {
  const { reviewId, employee, evaluator, selfScore, quarter, year, reflection, branchId } = params;
  const empName = employee ? `${employee.first_name} ${employee.last_name}`.trim() : "Employee";
  const mgrName = evaluator ? `${evaluator.first_name} ${evaluator.last_name}`.trim() : "Direct Manager";
  const empRole = employee?.app_role || employee?.role || "Staff";
  const empDept = employee?.department || "General";
  const period = `${quarter} ${year}`;
  const reflectionSnippet = reflection ? reflection.slice(0, 180) : "No reflection provided";

  // 1. System In-App Notification
  try {
    await notify({
      title: `Self-Assessment: ${empName}`,
      message: `${empName} (${empRole}) has submitted a self-assessment for ${period} (Self-Score: ${selfScore.toFixed(1)}/5.0). Awaiting evaluation by ${mgrName}.`,
      type: "info",
      source: "employees",
      entityId: reviewId || null,
      branchId: branchId || employee?.branch_id || null,
      skipTelegram: true,
    });
  } catch (err) {
    console.warn("[PerformanceNotifications] In-app notification warning:", err);
  }

  // 2. Telegram Broadcast Alert
  try {
    const lines = [
      `📝 <b>Employee Self-Assessment Submitted</b>`,
      ``,
      `👤 <b>Employee:</b> ${escapeTelegramHtml(empName)}`,
      `💼 <b>Role / Dept:</b> ${escapeTelegramHtml(empRole)} • ${escapeTelegramHtml(empDept)}`,
      `🎯 <b>Assigned Evaluator:</b> ${escapeTelegramHtml(mgrName)}`,
      `📅 <b>Evaluation Period:</b> ${escapeTelegramHtml(period)}`,
      `⭐ <b>Self-Assessment Score:</b> ${selfScore.toFixed(2)} / 5.0`,
      `💬 <b>Employee Reflection:</b> ${escapeTelegramHtml(reflectionSnippet)}`,
      `⏳ <b>Status:</b> Awaiting Manager Appraisal`,
    ];

    notifyTelegramEvent(
      lines.join("\n"),
      { text: "Review Self-Assessment", url: hrNexusUrl("/performance") }
    ).catch(() => {});
  } catch (err) {
    console.warn("[PerformanceNotifications] Telegram notification warning:", err);
  }
}

export async function notifyEvaluationCompleted(params: EvaluationCompletedNotifyParams): Promise<void> {
  const { reviewId, employee, evaluator, overallScore, quarter, year, comments, branchId } = params;
  const empName = employee ? `${employee.first_name} ${employee.last_name}`.trim() : "Employee";
  const mgrName = evaluator ? `${evaluator.first_name} ${evaluator.last_name}`.trim() : "Manager";
  const empRole = employee?.app_role || employee?.role || "Staff";
  const empDept = employee?.department || "General";
  const period = `${quarter} ${year}`;
  const commentsSnippet = comments ? comments.slice(0, 180) : "Completed evaluation.";

  // 1. System In-App Notification
  try {
    await notify({
      title: `Evaluation Completed: ${empName}`,
      message: `${mgrName} has completed the performance evaluation for ${empName} (${period}) with an overall score of ${overallScore.toFixed(1)}/5.0.`,
      type: "success",
      source: "employees",
      entityId: reviewId || null,
      branchId: branchId || employee?.branch_id || null,
      skipTelegram: true,
    });
  } catch (err) {
    console.warn("[PerformanceNotifications] In-app notification warning:", err);
  }

  // 2. Telegram Broadcast Alert
  try {
    const lines = [
      `🏆 <b>Performance Evaluation Completed</b>`,
      ``,
      `👤 <b>Employee:</b> ${escapeTelegramHtml(empName)}`,
      `💼 <b>Role / Dept:</b> ${escapeTelegramHtml(empRole)} • ${escapeTelegramHtml(empDept)}`,
      `✍️ <b>Evaluated By:</b> ${escapeTelegramHtml(mgrName)}`,
      `📅 <b>Evaluation Period:</b> ${escapeTelegramHtml(period)}`,
      `⭐ <b>Overall Rating:</b> ${overallScore.toFixed(2)} / 5.0`,
      `💬 <b>Summary:</b> ${escapeTelegramHtml(commentsSnippet)}`,
      `✅ <b>Status:</b> Completed`,
    ];

    notifyTelegramEvent(
      lines.join("\n"),
      { text: "View Evaluation", url: hrNexusUrl("/performance") }
    ).catch(() => {});
  } catch (err) {
    console.warn("[PerformanceNotifications] Telegram notification warning:", err);
  }
}
