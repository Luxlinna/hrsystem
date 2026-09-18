export type ExportPdfMode = "full_requisition" | "job_description";

export interface RequisitionPdfOptions {
  mode?: ExportPdfMode;
  buLogo?: string;
  businessUnit?: string;
  division?: string;
  jobTitle?: string;
  directReportsTo?: string;
  levelGrade?: string;
  typeOfPosition?: string;
  preparedDate?: string;
  workingDays?: string;
  workingTime?: string;
  headOfDeptName?: string;
  hrAdminName?: string;
  isHrDivisionContext?: boolean;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function capitalizeWords(str: string): string {
  if (!str) return "";
  return str
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

const ACTION_VERB_REGEX =
  /^(assist|write|implement|build|integrate|support|perform|test|help|maintain|document|prepare|work|participate|communicate|demonstrate|understand|learn|ensure|report|fix|collaborate|troubleshoot|review|create|design|manage|lead|develop|coordinate|conduct|analyze|optimize|handle|provide|follow|execute|deliver|monitor|deploy|gain|allowance|currently|basic|familiarity|strong|ability)\b/i;

export function isCategoryHeader(line: string): boolean {
  const clean = line.replace(/^[-*•\d.)\s]+/, "").trim();
  if (!clean) return false;
  if (clean.endsWith(":")) return true;
  if (
    /^(Mobile Application|Coding & Debugging|Testing & Quality|Testing & QA|Deployment &|Documentation|Team Collaboration|Web Development|Code Quality|Hard Skills|Soft Skills|Required|Preferred|Qualifications|Benefits|Technical Skills|Core Responsibilities)/i.test(
      clean
    )
  ) {
    return true;
  }
  // Short line without ending punctuation and not starting with an action verb
  if (clean.length < 48 && !clean.endsWith(".") && !ACTION_VERB_REGEX.test(clean)) {
    return true;
  }
  return false;
}

export function formatSectionText(text?: string | null): string {
  if (!text || !text.trim()) {
    return "<div style=\"color: #94a3b8; font-style: italic; padding: 4px 0;\">None specified</div>";
  }

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const htmlParts: string[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      htmlParts.push(
        `<ul style="margin: 3px 0 10px 20px; padding: 0; list-style-type: disc;">${currentList
          .map(
            (li) =>
              `<li style="margin-bottom: 4px; line-height: 1.5; color: #334155; font-size: 11.5px; text-align: justify;">${escapeHtml(
                li
              )}</li>`
          )
          .join("")}</ul>`
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is a category/subheading
    if (isCategoryHeader(line)) {
      flushList();
      const cleanHeader = line.replace(/^[-*•\d.)\s]+/, "").replace(/:$/, "").trim();
      htmlParts.push(
        `<div style="font-weight: 800; margin-top: 10px; margin-bottom: 4px; color: #1e293b; font-size: 12px; padding-left: 2px; page-break-after: avoid; break-after: avoid;">${escapeHtml(
          cleanHeader
        )}</div>`
      );
      continue;
    }

    // Check if bullet point
    const isBullet = /^[-*•]\s+/.test(line) || /^\d+[.)]\s+/.test(line);
    if (isBullet) {
      const clean = line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
      currentList.push(clean);
      continue;
    }

    // Regular paragraph
    flushList();
    htmlParts.push(
      `<p style="margin: 0 0 8px 0; line-height: 1.55; color: #334155; font-size: 11.5px; text-align: justify;">${escapeHtml(
        line
      )}</p>`
    );
  }
  flushList();

  return htmlParts.join("");
}
