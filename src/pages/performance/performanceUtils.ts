export const scoreColor = (s: number): string => {
  if (s >= 4.5) return "text-emerald-600";
  if (s >= 3.5) return "text-[#253C7D]";
  if (s >= 2.5) return "text-amber-600";
  return "text-red-500";
};

export const scoreBg = (s: number): string => {
  if (s >= 4.5) return "bg-emerald-50";
  if (s >= 3.5) return "bg-[#253C7D]/10";
  if (s >= 2.5) return "bg-amber-50";
  return "bg-red-50";
};

export const progressColor = (p: number): string => {
  if (p >= 80) return "bg-emerald-500";
  if (p >= 50) return "bg-[#253C7D]";
  if (p >= 25) return "bg-amber-500";
  return "bg-red-400";
};

const META_START = "<!--EVAL_META:";
const META_END = ":EVAL_META-->";

export function packReviewComment(baseComment: string | null | undefined, meta: Record<string, any>): string {
  const json = JSON.stringify(meta);
  const cleanBase = (baseComment || "").trim();
  return cleanBase ? `${cleanBase}\n${META_START}${json}${META_END}` : `${META_START}${json}${META_END}`;
}

export function unpackReviewData(raw: any): any {
  if (!raw) return raw;
  let comments = raw.comments || "";
  let meta: Record<string, any> = {};
  if (typeof comments === "string" && comments.includes(META_START)) {
    const sIdx = comments.indexOf(META_START);
    const eIdx = comments.indexOf(META_END);
    if (eIdx > sIdx) {
      try {
        const jsonStr = comments.substring(sIdx + META_START.length, eIdx);
        meta = JSON.parse(jsonStr);
        comments = (comments.substring(0, sIdx) + comments.substring(eIdx + META_END.length)).trim();
      } catch (e) {
        console.error("Failed to parse eval meta", e);
      }
    }
  }
  return {
    ...raw,
    ...meta,
    id: raw.id,
    employee_id: raw.employee_id,
    reviewer_id: raw.reviewer_id,
    employee: raw.employee,
    reviewer: raw.reviewer,
    comments,
    status: meta.status || raw.status,
  };
}
