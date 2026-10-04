import type { InterviewerSlot } from "./interviewEvaluationPdfTypes";

export function escapeHtml(str?: string | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function formatOrdinalDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  const day = d.getDate();
  const j = day % 10;
  const k = day % 100;
  let ord = "th";
  if (j === 1 && k !== 11) ord = "st";
  else if (j === 2 && k !== 12) ord = "nd";
  else if (j === 3 && k !== 13) ord = "rd";

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}${ord} ${month} ${year}`;
}

export function renderInterviewerTd(title: string, slot?: InterviewerSlot): string {
  const name = slot?.name?.trim() ? escapeHtml(slot.name) : "....................";
  const pos = slot?.position?.trim() ? escapeHtml(slot.position) : "....................";
  const date = slot?.date?.trim() ? escapeHtml(slot.date) : "....................";

  return `
    <td style="width: 25%; border: 1px solid #000; vertical-align: top; padding: 6px 6px;">
      <div style="text-align: center; font-weight: bold; font-size: 11px; margin-bottom: 45px;">${escapeHtml(title)}</div>
      <div style="border-top: 1px solid #000; padding-top: 4px; font-size: 10px; line-height: 1.45;">
        <div>Name: ${name}</div>
        <div>Position: ${pos}</div>
        <div>Date: ${date}</div>
      </div>
    </td>
  `;
}
