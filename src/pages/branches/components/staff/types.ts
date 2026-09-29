import type { Employee } from "../../types";

export interface BranchStaffSectionProps {
  deptGroups: Record<string, Employee[]>;
  empLoading: boolean;
  branchName?: string;
}

export function getStaffStatusMeta(status?: string) {
  const s = (status || "active").toLowerCase();
  if (s === "active") {
    return {
      dot: "bg-emerald-500",
      pill: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      label: "Active",
    };
  }
  if (s === "onboarding" || s === "probation") {
    return {
      dot: "bg-blue-500",
      pill: "bg-blue-50 text-blue-700 border-blue-200/80",
      label: s.charAt(0).toUpperCase() + s.slice(1),
    };
  }
  if (s === "suspended" || s === "leave") {
    return {
      dot: "bg-amber-500",
      pill: "bg-amber-50 text-amber-700 border-amber-200/80",
      label: s.charAt(0).toUpperCase() + s.slice(1),
    };
  }
  return {
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-600 border-slate-200",
    label: s.charAt(0).toUpperCase() + s.slice(1),
  };
}
