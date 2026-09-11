/**
 * Helper to encode and decode multiple invited BU interviewers in interview notes
 */

export interface PanelMemberSummary {
  id?: string;
  name: string;
  role?: string;
}

export function serializeInterviewPanelNotes(params: {
  notes?: string;
  stageKey?: string;
  panelMembers?: PanelMemberSummary[];
}): string {
  const { notes = "", stageKey, panelMembers = [] } = params;

  // Remove existing [Stage: ...] and [Panel: ...] tags
  let cleaned = notes
    .replace(/\[Stage:.*?\]\s*/g, "")
    .replace(/\[Panel:.*?\]\s*/g, "")
    .replace(/\[PanelIds:.*?\]\s*/g, "")
    .trim();

  const parts: string[] = [];

  if (stageKey) {
    parts.push(`[Stage: ${stageKey}]`);
  }

  if (panelMembers.length > 0) {
    const namesStr = panelMembers
      .map((m) => (m.role ? `${m.name} (${m.role})` : m.name))
      .join(", ");
    parts.push(`[Panel: ${namesStr}]`);

    const idsWithVal = panelMembers.map((m) => m.id).filter(Boolean);
    if (idsWithVal.length > 0) {
      parts.push(`[PanelIds: ${idsWithVal.join(",")}]`);
    }
  }

  if (cleaned) {
    parts.push(cleaned);
  }

  return parts.join(" ").trim();
}

export function parseInterviewPanelFromNotes(rawNotes?: string | null): {
  stageKey: string;
  panelMembers: PanelMemberSummary[];
  panelIds: string[];
  cleanNotes: string;
} {
  const notes = rawNotes || "";

  // Extract stageKey
  const stageMatch = notes.match(/\[Stage:\s*(.*?)\]/i);
  const stageKey = stageMatch ? stageMatch[1].trim() : "";

  // Extract PanelIds
  const idsMatch = notes.match(/\[PanelIds:\s*(.*?)\]/i);
  const panelIds = idsMatch
    ? idsMatch[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // Extract panel members
  const panelMatch = notes.match(/\[Panel:\s*(.*?)\]/i);
  const panelMembers: PanelMemberSummary[] = [];

  if (panelMatch) {
    const rawList = panelMatch[1].split(",");
    rawList.forEach((item, idx) => {
      const trimmed = item.trim();
      if (!trimmed) return;
      // Match "Name (Role)"
      const roleMatch = trimmed.match(/^(.*?)\s*\((.*?)\)$/);
      if (roleMatch) {
        panelMembers.push({
          id: panelIds[idx] || undefined,
          name: roleMatch[1].trim(),
          role: roleMatch[2].trim(),
        });
      } else {
        panelMembers.push({
          id: panelIds[idx] || undefined,
          name: trimmed,
        });
      }
    });
  }

  // Clean notes
  const cleanNotes = notes
    .replace(/\[Stage:.*?\]\s*/g, "")
    .replace(/\[Panel:.*?\]\s*/g, "")
    .replace(/\[PanelIds:.*?\]\s*/g, "")
    .trim();

  return {
    stageKey,
    panelMembers,
    panelIds,
    cleanNotes,
  };
}

/**
 * Formats the exact interview end time based on scheduled_at and duration_minutes
 * e.g. "11 Sep 2026 3:00PM"
 */
export function formatInterviewEndTime(
  scheduledAt?: string | null,
  durationMinutes: number | string = 60
): string {
  if (!scheduledAt) {
    return (
      new Date().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + " 3:00PM"
    );
  }

  const start = new Date(scheduledAt);
  if (isNaN(start.getTime())) {
    return (
      new Date().toLocaleDateString("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + " 3:00PM"
    );
  }

  const durationMs = (Number(durationMinutes) || 60) * 60000;
  const end = new Date(start.getTime() + durationMs);

  const day = end.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  let hours = end.getHours();
  const minutes = end.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minStr = minutes < 10 ? "0" + minutes : minutes;
  const timeStr = `${hours}:${minStr}${ampm}`;

  return `${day} ${timeStr}`;
}

/**
 * Extracts and synthesizes evaluator feedback (strengths, improvement, overall remarks) from completed interviews
 */
export function extractFeedbackFromInterviews(interviews: any[] = []): {
  strengths: string;
  improvement: string;
  overallAssessment: string;
} {
  const completed = interviews.filter(
    (iv) => iv.status === "completed" || Boolean(iv.feedback || iv.score)
  );

  if (completed.length === 0) {
    return { strengths: "", improvement: "", overallAssessment: "" };
  }

  const strengthsList: string[] = [];
  const concernsList: string[] = [];
  const assessmentList: string[] = [];

  for (const iv of completed) {
    const defaultEvaluatorName = iv.employees
      ? `${iv.employees.first_name || ""} ${iv.employees.last_name || ""}`.trim()
      : "Evaluator";
    const defaultRole = iv.employees?.role || iv.type || "Interview Panel";
    const defaultScoreStr = iv.score ? `★ ${iv.score}/5` : "";

    const raw = iv.feedback || "";
    if (raw) {
      // Split into distinct evaluator blocks if multiple panelists evaluated
      const blocks = raw
        .split(/\n\s*---\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean);

      for (const block of blocks) {
        // Check for specific evaluator name inside block
        const evalMatch = block.match(/Evaluator:\s*(.*?)(?=\n|$)/i);
        const evaluatorName = evalMatch && evalMatch[1].trim() ? evalMatch[1].trim() : defaultEvaluatorName;

        // Check for role match if available in notes panel
        let role = defaultRole;
        if (iv.notes) {
          const { panelMembers } = parseInterviewPanelFromNotes(iv.notes);
          const matched = panelMembers.find((m) => m.name.toLowerCase() === evaluatorName.toLowerCase());
          if (matched?.role) role = matched.role;
        }

        // Check for specific score in block
        const blockScoreMatch = block.match(/Score:\s*(\d+(\.\d+)?)/);
        const scoreStr = blockScoreMatch ? `★ ${blockScoreMatch[1]}/5` : defaultScoreStr;

        // Check for structured evaluation remarks
        const strengthsMatch = block.match(/Strengths:\s*(.*?)(?=\nConcerns:|\nRemarks:|\nScore:|$)/is);
        if (strengthsMatch && strengthsMatch[1].trim()) {
          strengthsList.push(strengthsMatch[1].trim());
        }

        const concernsMatch = block.match(/Concerns:\s*(.*?)(?=\nRemarks:|\nStrengths:|\nScore:|$)/is);
        if (concernsMatch && concernsMatch[1].trim()) {
          concernsList.push(concernsMatch[1].trim());
        }

        const remarksMatch = block.match(/Remarks:\s*(.*?)(?=\nStrengths:|\nConcerns:|$)/is);
        const recMatch = block.match(/Recommendation:\s*(.*?)(?=\n|$)/i);

        if (remarksMatch && remarksMatch[1].trim()) {
          assessmentList.push(
            `[${role}] ${evaluatorName}${scoreStr ? ` (${scoreStr})` : ""}${recMatch ? ` — ${recMatch[1].trim()}` : ""}: ${remarksMatch[1].trim()}`
          );
        } else if (!strengthsMatch && !concernsMatch) {
          // Plain text remarks from FeedbackModal
          assessmentList.push(
            `[${role}] ${evaluatorName}${scoreStr ? ` (${scoreStr})` : ""}: ${block.trim()}`
          );
        }
      }
    } else if (iv.score) {
      assessmentList.push(`[${defaultRole}] ${defaultEvaluatorName} endorsed candidate with rating ${iv.score}/5.`);
    }
  }

  return {
    strengths: strengthsList.join(". "),
    improvement: concernsList.join(". "),
    overallAssessment: assessmentList.join("\n\n"),
  };
}

export function resolveInterviewStageKey(
  interview?: { notes?: string | null; type?: string | null } | null,
  candidate?: { stage?: string | null } | null
): string {
  if (interview?.notes) {
    const { stageKey } = parseInterviewPanelFromNotes(interview.notes);
    if (stageKey && ["hr_interview", "hiring_manager_interview", "final_interview"].includes(stageKey)) {
      return stageKey;
    }
  }

  const typeStr = (interview?.type || "").toLowerCase();
  const notesStr = (interview?.notes || "").toLowerCase();

  if (typeStr.includes("hr") || notesStr.includes("hr_interview") || notesStr.includes("screening")) {
    return "hr_interview";
  }
  if (typeStr.includes("final") || typeStr.includes("executive") || typeStr.includes("management") || notesStr.includes("final_interview")) {
    return "final_interview";
  }
  if (typeStr.includes("technical") || typeStr.includes("hiring") || notesStr.includes("hiring_manager_interview")) {
    return "hiring_manager_interview";
  }

  if (candidate?.stage) {
    const s = candidate.stage.toLowerCase();
    if (s.includes("hr")) return "hr_interview";
    if (s.includes("final") || s.includes("executive")) return "final_interview";
    if (s.includes("technical") || s.includes("interview")) return "hiring_manager_interview";
  }

  return "hiring_manager_interview";
}

export function isUserInvitedToInterview(params: {
  interview?: {
    interviewer_id?: string | null;
    notes?: string | null;
    employees?: { id?: string; first_name?: string; last_name?: string } | null;
  } | null;
  candidate?: {
    assigned_recruiter_id?: string | null;
  } | null;
  myEmployeeId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  isAdminOrRecruiter?: boolean;
}): boolean {
  const { interview, candidate, myEmployeeId, actorName, isAdminOrRecruiter } = params;

  // 1. SuperAdmins, HR Admins, HR Division staff, or assigned recruiter have oversight
  if (isAdminOrRecruiter) return true;

  // If user is the assigned recruiter for this candidate
  if (candidate?.assigned_recruiter_id && myEmployeeId && candidate.assigned_recruiter_id === myEmployeeId) {
    return true;
  }

  if (!interview) return false;

  // 2. Direct primary interviewer match by ID
  if (myEmployeeId) {
    if (interview.interviewer_id && interview.interviewer_id === myEmployeeId) return true;
    if (interview.employees?.id && interview.employees.id === myEmployeeId) return true;
  }

  // 3. Panel IDs in notes: [PanelIds: uuid-1,uuid-2]
  if (interview.notes) {
    const { panelIds, panelMembers } = parseInterviewPanelFromNotes(interview.notes);

    if (myEmployeeId && panelIds.length > 0 && panelIds.includes(myEmployeeId)) {
      return true;
    }

    // 4. Panel member names in notes: [Panel: Ranit Ren, Thorng Dararith]
    if (actorName && panelMembers.length > 0) {
      const cleanActor = actorName.trim().toLowerCase();
      const matchedByName = panelMembers.some((m) => {
        const mName = (m.name || "").trim().toLowerCase();
        if (!mName || !cleanActor) return false;
        return (
          mName === cleanActor ||
          mName.includes(cleanActor) ||
          cleanActor.includes(mName)
        );
      });
      if (matchedByName) return true;
    }
  }

  // 5. Match by primary interviewer employee name if ID is missing or mismatched
  if (interview.employees && actorName) {
    const fullName = `${interview.employees.first_name || ""} ${interview.employees.last_name || ""}`.trim().toLowerCase();
    const cleanActor = actorName.trim().toLowerCase();
    if (fullName && cleanActor && (fullName === cleanActor || fullName.includes(cleanActor) || cleanActor.includes(fullName))) {
      return true;
    }
  }

  return false;
}



