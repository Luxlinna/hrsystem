import type { OnboardingRequest, OnboardingDoc } from "../types";
import { STAGES } from "../constants";
import { getOverallProgress } from "../onboardingUtils";

// Helper for dynamic XLSX loading
const getXLSX = async () => {
  return await import("xlsx");
};

const getStageLabel = (stageKey: string) => {
  const match = STAGES.find((s) => s.key === stageKey);
  return match?.label || stageKey;
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "approved":
      return "In Progress";
    case "pending":
      return "Pending Approval";
    default:
      return status;
  }
};

export const exportOnboardingXLSX = async (
  requests: OnboardingRequest[],
  documents: OnboardingDoc[],
  filename = "onboarding_workforce_report.xlsx"
) => {
  if (requests.length === 0) return;

  // Sheet 1: Onboarding Candidates Overview
  const overviewData = requests.map((req) => {
    const reqDocs = documents.filter((d) => d.onboarding_request_id === req.id);
    const completedDocs = reqDocs.filter((d) => d.status === "complete").length;

    return {
      "Employee Name": req.employees ? `${req.employees.first_name} ${req.employees.last_name}` : "Unknown",
      Role: req.employees?.role || "—",
      Department: req.employees?.department || "—",
      Branch: req.employees?.branches?.name || "Headquarters",
      "Current Stage": getStageLabel(req.stage),
      Status: getStatusLabel(req.status),
      "Days Active": req.day_count || 0,
      "Progress (%)": `${getOverallProgress(req, documents)}%`,
      "Tasks Completed": `${completedDocs} / ${reqDocs.length}`,
      "Started Date": req.created_at ? new Date(req.created_at).toLocaleDateString("en-US") : "—",
    };
  });

  // Sheet 2: Document / Checklist Breakdown
  const checklistData = documents.map((doc) => {
    const req = requests.find((r) => r.id === doc.onboarding_request_id);
    const empName = req?.employees ? `${req.employees.first_name} ${req.employees.last_name}` : "Unknown";

    return {
      "Employee Name": empName,
      "Task / Document Name": doc.document_name,
      Stage: getStageLabel(doc.stage),
      Status: doc.status.toUpperCase(),
      "Due Date": doc.due_date ? new Date(doc.due_date).toLocaleDateString("en-US") : "—",
      "Attachment Attached": doc.file_url ? "Yes" : "No",
      Notes: doc.notes || "—",
    };
  });

  const XLSX = await getXLSX();
  const wb = XLSX.utils.book_new();

  // Overview Sheet
  const ws1 = XLSX.utils.json_to_sheet(overviewData);
  const headers1 = Object.keys(overviewData[0]);
  ws1["!cols"] = headers1.map((c) => ({ wch: Math.max(c.length + 3, 16) }));
  XLSX.utils.book_append_sheet(wb, ws1, "Onboarding Overview");

  // Checklist Details Sheet
  if (checklistData.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(checklistData);
    const headers2 = Object.keys(checklistData[0]);
    ws2["!cols"] = headers2.map((c) => ({ wch: Math.max(c.length + 3, 16) }));
    XLSX.utils.book_append_sheet(wb, ws2, "Checklist Details");
  }

  XLSX.writeFile(wb, filename);
};
