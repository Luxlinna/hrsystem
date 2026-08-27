import type { BranchFormState } from "./types";

export const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-gray-100 text-gray-500",
  pending: "bg-amber-50 text-amber-700",
};

export const deptColors = [
  "bg-[#253C7D]/10 text-[#253C7D]",
  "bg-violet-50 text-violet-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-sky-50 text-sky-700",
  "bg-emerald-50 text-emerald-700",
];

export const INITIAL_BRANCH_FORM: BranchFormState = {
  name: "",
  location: "",
  manager_name: "",
  status: "active",
  latitude: "",
  longitude: "",
  geofence_radius_m: "100",
  work_start_time: "",
  work_end_time: "",
};
