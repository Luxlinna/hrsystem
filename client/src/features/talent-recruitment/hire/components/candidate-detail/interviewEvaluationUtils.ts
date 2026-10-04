import type { Interview } from "../../types";
import { parseInterviewPanelFromNotes } from "../../utils/interviewPanelHelper";
import type { InterviewerSlot } from "../../exports/exportInterviewEvaluationPdf";

export const STAGE_FORM_METADATA: Record<
  string,
  {
    title: string;
    subtitle: string;
    badge: string;
    responsible: string;
    criteria: string[];
  }
> = {
  hr_interview: {
    title: "HR Interview Results & Evaluation",
    subtitle: "Screening cultural alignment, interpersonal readiness & compensation expectations",
    badge: "Stage 4 • HR Interview",
    responsible: "HR Manager / Recruiter",
    criteria: [
      "Cultural Fit & Value Alignment",
      "Communication & Interpersonal Clarity",
      "Career Motivation & Compensation Fit",
    ],
  },
  hiring_manager_interview: {
    title: "Hiring Manager Technical Results Form",
    subtitle: "In-depth functional assessment, problem solving & domain competencies",
    badge: "Stage 5 • Technical Round",
    responsible: "Hiring Manager",
    criteria: [
      "Technical Competency & Domain Depth",
      "Practical Problem Solving & Logic",
      "Execution Speed & Architecture Readiness",
    ],
  },
  final_interview: {
    title: "Executive Interview Results & Endorsement",
    subtitle: "Executive leadership sign-off, vision alignment & final endorsement",
    badge: "Stage 6 • Executive Round",
    responsible: "CEO / Division Director",
    criteria: [
      "Strategic Alignment & Growth Mindset",
      "Leadership Presence & Team Synergy",
      "Executive Readiness & Culture Impact",
    ],
  },
};

export const RECOMMENDATIONS = [
  { key: "recommend_to_hire", label: "Recommend to Hire", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  { key: "hold", label: "Hold", color: "bg-amber-50 text-amber-700 border-amber-300" },
  { key: "do_not_recommend", label: "Do not recommend to hire", color: "bg-rose-50 text-rose-700 border-rose-300" },
  { key: "available_another", label: "Available for Another Position", color: "bg-purple-50 text-purple-700 border-purple-300" },
] as const;

export function parseInterviewFeedback(feedback?: string | null, currentEvaluatorName?: string) {
  if (!feedback) {
    return {
      strengths: "",
      concerns: "",
      remarks: "",
      rec: "recommend_to_hire" as const,
      score: undefined,
      evaluator: "",
    };
  }

  const blocks = feedback.split(/\n\s*---\s*\n/).map((b) => b.trim()).filter(Boolean);

  let targetBlock = blocks[0] || feedback;
  if (currentEvaluatorName && blocks.length > 1) {
    const cleanCurrent = currentEvaluatorName.trim().toLowerCase();
    const matched = blocks.find((b) => {
      const evalLine = b.split("\n").find((l) => l.toLowerCase().startsWith("evaluator:"));
      if (!evalLine) return false;
      const evalName = evalLine.replace(/evaluator:\s*/i, "").trim().toLowerCase();
      return evalName === cleanCurrent || evalName.includes(cleanCurrent) || cleanCurrent.includes(evalName);
    });
    if (matched) {
      targetBlock = matched;
    } else {
      return {
        strengths: "",
        concerns: "",
        remarks: "",
        rec: "recommend_to_hire" as const,
        score: undefined,
        evaluator: currentEvaluatorName,
      };
    }
  }

  if (targetBlock.includes("[EVALUATION FORM:") || targetBlock.includes("Recommendation: ")) {
    const lines = targetBlock.split("\n");
    let strengths = "";
    let concerns = "";
    let remarks = "";
    let evaluator = "";
    let rec: "recommend_to_hire" | "hold" | "do_not_recommend" | "available_another" = "recommend_to_hire";
    let score: number | undefined = undefined;

    lines.forEach((line) => {
      if (line.startsWith("Evaluator: ")) evaluator = line.replace("Evaluator: ", "").trim();
      else if (line.startsWith("Strengths: ")) strengths = line.replace("Strengths: ", "").trim();
      else if (line.startsWith("Concerns: ")) concerns = line.replace("Concerns: ", "").trim();
      else if (line.startsWith("Remarks: ")) remarks = line.replace("Remarks: ", "").trim();
      else if (line.startsWith("Score: ")) {
        const match = line.match(/Score:\s*(\d+(\.\d+)?)/);
        if (match) score = parseFloat(match[1]);
      } else if (line.startsWith("Recommendation: ")) {
        const r = line.toLowerCase();
        if (r.includes("strong") || r.includes("recommend to hire") || r.includes("recommend_to_hire")) rec = "recommend_to_hire";
        else if (r.includes("hold")) rec = "hold";
        else if (r.includes("another") || r.includes("available")) rec = "available_another";
        else if (r.includes("not proceed") || r.includes("reject") || r.includes("do not recommend")) rec = "do_not_recommend";
        else rec = "recommend_to_hire";
      }
    });

    return { strengths, concerns, remarks: remarks || targetBlock, rec, score, evaluator };
  }

  return {
    strengths: "",
    concerns: "",
    remarks: targetBlock.trim(),
    rec: "recommend_to_hire" as const,
    score: undefined,
    evaluator: "",
  };
}

export function extractInterviewerSlots(
  iv?: Interview,
  fallbackName?: string,
  fallbackDate?: string
): InterviewerSlot[] {
  const slots: InterviewerSlot[] = [];

  const dateStr = iv?.scheduled_at
    ? new Date(iv.scheduled_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })
    : (fallbackDate ? new Date(fallbackDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" }) : "");

  const panel = iv?.notes ? parseInterviewPanelFromNotes(iv.notes) : null;
  const primaryName = iv?.employees
    ? `${iv.employees.first_name || ""} ${iv.employees.last_name || ""}`.trim()
    : (fallbackName || "");

  if (primaryName) {
    const employeeRole = (iv?.employees as any)?.job_title || (iv?.employees as any)?.role || "Interviewer";
    slots.push({
      name: primaryName,
      position: employeeRole,
      date: dateStr,
    });
  }

  if (panel?.panelMembers) {
    panel.panelMembers.forEach((pm) => {
      if (slots.length < 4) {
        slots.push({
          name: pm.name,
          position: pm.role || "Interviewer",
          date: dateStr,
        });
      }
    });
  }

  while (slots.length < 4) {
    slots.push({ name: "", position: "", date: "" });
  }

  return slots;
}
