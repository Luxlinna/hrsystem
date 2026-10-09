import { memo, useState, useMemo } from "react";
import type { Employee } from "../types";
import type { BranchStaffSectionProps } from "./staff/types";
import { BranchStaffDeptGroup } from "./staff/BranchStaffDeptGroup";

export const BranchStaffSection = memo(function BranchStaffSection({
  deptGroups,
  empLoading,
  branchName,
}: BranchStaffSectionProps) {
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const toggleDept = (dept: string) => {
    setExpandedDepts((prev) => ({ ...prev, [dept]: !(prev[dept] ?? true) }));
  };

  const filteredGroups = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return deptGroups;
    const result: Record<string, Employee[]> = {};
    for (const [dept, emps] of Object.entries(deptGroups)) {
      const matched = emps.filter(
        (e) =>
          `${e.last_name || ""} ${e.first_name || ""}`.toLowerCase().includes(term) ||
          (e.role && e.role.toLowerCase().includes(term)) ||
          (e.department && e.department.toLowerCase().includes(term)) ||
          (e.biometric_user_id && e.biometric_user_id.toLowerCase().includes(term))
      );
      if (matched.length > 0) result[dept] = matched;
    }
    return result;
  }, [deptGroups, searchTerm]);

  const allEmployees = useMemo(() => Object.values(deptGroups).flat(), [deptGroups]);
  const totalCount = allEmployees.length;
  const activeCount = allEmployees.filter((e) => (e.status || "active").toLowerCase() === "active").length;
  const totalDepts = Object.keys(deptGroups).length;

  return (
    <div className="p-4 sm:p-6 bg-white space-y-5">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Staff Directory</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {totalCount} Total
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>{totalDepts} {totalDepts === 1 ? "Department" : "Departments"}</span>
            <span>·</span>
            <span className="text-emerald-600 font-medium">{activeCount} Active</span>
          </div>
        </div>

        {/* Search Filter */}
        {totalCount > 0 && (
          <div className="relative w-full md:w-72">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, role, biometric ID..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0088cc] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <i className="ri-close-circle-fill text-sm" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Directory Content */}
      {empLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-[#0088cc] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading staff records...</p>
        </div>
      ) : Object.keys(filteredGroups).length === 0 ? (
        <div className="text-center py-12 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
            <i className="ri-user-search-line text-lg" />
          </div>
          <p className="text-xs font-semibold text-slate-700">No employees found</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {searchTerm ? "Try searching for a different name or role" : "No staff members are assigned to this branch"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(filteredGroups).map(([dept, emps]) => (
            <BranchStaffDeptGroup
              key={dept}
              dept={dept}
              employees={emps}
              isExpanded={expandedDepts[dept] ?? true}
              onToggle={() => toggleDept(dept)}
              branchName={branchName}
            />
          ))}
        </div>
      )}
    </div>
  );
});
