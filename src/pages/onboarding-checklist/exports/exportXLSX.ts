import type { OnboardingHire, ChecklistTask } from "../types";
import { getHireName } from "../checklistUtils";

const getXLSX = async () => {
  return await import("xlsx");
};

export const exportChecklistXLSX = async (hire: OnboardingHire, tasks: ChecklistTask[]) => {
  const hireName = getHireName(hire);
  const data = tasks.map((t, idx) => ({
    "#": idx + 1,
    "Task Name": t.task_name,
    Category: t.category || "General",
    Status: t.completed ? "COMPLETED" : "PENDING",
    Priority: (t.priority || "medium").toUpperCase(),
    "Due Date": t.due_date || "—",
    Description: t.description || "",
  }));

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [{ wch: 4 }, { wch: 36 }, { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Checklist Tasks");
  XLSX.writeFile(wb, `checklist_${hireName.toLowerCase().replace(/\s+/g, "_")}.xlsx`);
};
