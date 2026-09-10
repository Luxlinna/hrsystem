import { memo } from "react";
import type { RecruitmentActionRole } from "../../types";
import { ROLE_INFO } from "../../hooks/useRecruitmentActions";

const ROLES_LIST: RecruitmentActionRole[] = [
  "hiring_manager",
  "manager",
  "hr_manager",
  "hr_director",
  "ceo_director",
  "chairwoman",
];

interface RecruitmentActionsHeaderProps {
  selectedRole: RecruitmentActionRole;
  onSelectRole: (role: RecruitmentActionRole) => void;
  defaultRole: RecruitmentActionRole;
  totalCount: number;
}

export const RecruitmentActionsHeader = memo(function RecruitmentActionsHeader({
  selectedRole,
  onSelectRole,
  defaultRole,
  totalCount,
}: RecruitmentActionsHeaderProps) {
  const roleInfo = ROLE_INFO[selectedRole];

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              HR Division Exclusive Workflow
            </span>
            <span className="text-xs text-gray-400 font-medium">• Role-Scoped Action Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <i className="ri-checkbox-circle-line text-[#253C7D]" />
            My Recruitment Actions
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Each role sees only the action items relevant to their specific stage and responsibility, never the full pipeline.
          </p>
        </div>

        {/* Quick Counter Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-tr from-[#253C7D] to-[#3B5998] text-white shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">Total Pending Actions</p>
            <p className="text-2xl font-black">{totalCount}</p>
          </div>
        </div>
      </div>

      {/* Role Scoping Segmented Bar */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
            Scoped Responsibility Role
          </span>
          <span className="text-[11px] text-gray-500">
            Active Scope: <strong className="text-gray-900">{roleInfo.label}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {ROLES_LIST.map((r) => {
            const info = ROLE_INFO[r];
            const isSelected = selectedRole === r;
            const isDefault = defaultRole === r;

            return (
              <button
                key={r}
                type="button"
                onClick={() => onSelectRole(r)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200/80"
                }`}
              >
                <i className={`${info.icon} text-sm`} />
                <span>{info.label}</span>
                {isDefault && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                      isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
                    }`}
                    title="Auto-detected from your user profile"
                  >
                    You
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scope Explanation Card */}
        <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
          <i className={`${roleInfo.icon} text-base text-blue-700 shrink-0 mt-0.5`} />
          <div className="flex-1">
            <span className="font-extrabold">{roleInfo.label} Scope: </span>
            <span className="text-blue-800">{roleInfo.description}</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-white border border-blue-200 text-[10px] font-bold text-blue-700 shrink-0">
            {roleInfo.scopeBadge}
          </span>
        </div>
      </div>
    </div>
  );
});
