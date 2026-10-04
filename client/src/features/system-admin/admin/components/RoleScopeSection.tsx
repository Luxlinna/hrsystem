import { memo, useState } from "react";
import type { RoleFormState } from "../types";
import { ACTION_OVERRIDES, VISIBILITY_OVERRIDES, SCOPE_OVERRIDES } from "../constants";

interface RoleScopeSectionProps {
  roleForm: RoleFormState;
  setRoleForm: React.Dispatch<React.SetStateAction<RoleFormState>>;
}

interface ScopeGroup {
  title: string;
  icon: string;
  items: (typeof SCOPE_OVERRIDES[number])[];
}

export const RoleScopeSection = memo(function RoleScopeSection({
  roleForm,
  setRoleForm,
}: RoleScopeSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<"action" | "visibility">("action");

  const actionItems = ACTION_OVERRIDES;
  const visibilityItems = VISIBILITY_OVERRIDES;

  const actionGrantedCount = actionItems.filter((o) => roleForm[o.key]).length;
  const visibilityGrantedCount = visibilityItems.filter((o) => roleForm[o.key]).length;

  const toggleAllInSubTab = (grantAll: boolean) => {
    const items = activeSubTab === "action" ? actionItems : visibilityItems;
    setRoleForm((prev) => {
      const updated = { ...prev };
      items.forEach((item) => {
        (updated as any)[item.key] = grantAll;
      });
      return updated;
    });
  };

  const actionGroups: ScopeGroup[] = [
    {
      title: "Leave Endorsement & Approvals",
      icon: "ri-calendar-check-line",
      items: actionItems.filter((i) => i.key.startsWith("leave_")),
    },
    {
      title: "Recruitment Requisition Stages",
      icon: "ri-file-list-3-line",
      items: actionItems.filter((i) => i.key.startsWith("hiring_requests_")),
    },
    {
      title: "Candidate Offer Signatures",
      icon: "ri-quill-pen-line",
      items: actionItems.filter((i) => i.key.startsWith("candidate_approval_")),
    },
    {
      title: "General & Operational Actions",
      icon: "ri-tools-line",
      items: actionItems.filter(
        (i) =>
          !i.key.startsWith("leave_") &&
          !i.key.startsWith("hiring_requests_") &&
          !i.key.startsWith("candidate_approval_")
      ),
    },
  ];

  const visibilityGroups: ScopeGroup[] = [
    {
      title: "Leave & Attendance Visibility",
      icon: "ri-time-line",
      items: visibilityItems.filter((i) => i.key.startsWith("leave_") || i.key.startsWith("attendance_")),
    },
    {
      title: "Payroll & Compensation Visibility",
      icon: "ri-money-dollar-circle-line",
      items: visibilityItems.filter((i) => i.key.startsWith("payroll_")),
    },
    {
      title: "Performance, Disciplinary & Tasks",
      icon: "ri-survey-line",
      items: visibilityItems.filter(
        (i) =>
          i.key.startsWith("performance_") ||
          i.key.startsWith("disciplinary_") ||
          i.key.startsWith("task_")
      ),
    },
    {
      title: "Self-Service & Other Overrides",
      icon: "ri-user-shared-line",
      items: visibilityItems.filter(
        (i) =>
          !i.key.startsWith("leave_") &&
          !i.key.startsWith("attendance_") &&
          !i.key.startsWith("payroll_") &&
          !i.key.startsWith("performance_") &&
          !i.key.startsWith("disciplinary_") &&
          !i.key.startsWith("task_")
      ),
    },
  ];

  const currentGroups = activeSubTab === "action" ? actionGroups : visibilityGroups;

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher + Bulk Action Links */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-4 text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab("action")}
            className={`pb-1.5 font-semibold border-b-2 cursor-pointer transition-colors ${
              activeSubTab === "action"
                ? "border-[#253C7D] text-[#253C7D] dark:border-sky-400 dark:text-sky-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400"
            }`}
          >
            Approval Authority ({actionGrantedCount}/{actionItems.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("visibility")}
            className={`pb-1.5 font-semibold border-b-2 cursor-pointer transition-colors ${
              activeSubTab === "visibility"
                ? "border-[#253C7D] text-[#253C7D] dark:border-sky-400 dark:text-sky-400"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400"
            }`}
          >
            Visibility Overrides ({visibilityGrantedCount}/{visibilityItems.length})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => toggleAllInSubTab(true)}
            className="text-[#253C7D] dark:text-sky-400 font-medium hover:underline cursor-pointer text-[11px]"
          >
            Select All
          </button>
          <span className="text-gray-300 dark:text-slate-700">·</span>
          <button
            type="button"
            onClick={() => toggleAllInSubTab(false)}
            className="text-gray-400 dark:text-slate-500 font-medium hover:underline cursor-pointer text-[11px]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Grouped Permissions List */}
      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
        {currentGroups.map((grp) => {
          if (grp.items.length === 0) return null;
          return (
            <div key={grp.title} className="space-y-1.5">
              <div className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {grp.title}
              </div>

              <div className="divide-y divide-gray-100 dark:divide-slate-800 border border-gray-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-800/40">
                {grp.items.map((o) => {
                  const checked = Boolean(roleForm[o.key]);
                  return (
                    <label
                      key={o.key}
                      onClick={() => setRoleForm((p) => ({ ...p, [o.key]: !checked }))}
                      className="flex items-start gap-3 p-2.5 hover:bg-gray-50/80 dark:hover:bg-slate-800/80 transition-colors cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-gray-300 text-[#253C7D] focus:ring-0 cursor-pointer"
                      />

                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-gray-800 dark:text-slate-200 block leading-snug">
                          {o.label}
                        </span>
                        {o.hint && (
                          <span className="text-[11px] text-gray-400 dark:text-slate-500 block leading-normal mt-0.5">
                            {o.hint}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
