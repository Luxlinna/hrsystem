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
  defaultRole: RecruitmentActionRole | null;
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
    <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs space-y-3">
      {/* Top Header Row: Role Switcher & Active Role Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {ROLES_LIST.map((r) => {
            const info = ROLE_INFO[r];
            const isSelected = selectedRole === r;
            const isDefault = defaultRole === r;

            return (
              <button
                key={r}
                type="button"
                onClick={() => onSelectRole(r)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                  isSelected
                    ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                    : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200/70"
                }`}
              >
                <i className={`${info.icon} text-xs`} />
                <span>{info.label}</span>
                {isDefault && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                      isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-[#253C7D]"
                    }`}
                  >
                    You
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            {totalCount} Pending Actions
          </span>
        </div>
      </div>

      {/* Role Scope Context Hint */}
      <div className="flex items-center justify-between gap-2 text-xs text-gray-500 bg-slate-50/70 px-3 py-2 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <i className={`${roleInfo.icon} text-sm text-[#253C7D] shrink-0`} />
          <span className="truncate">
            <strong className="text-gray-900 font-bold">{roleInfo.label}:</strong> {roleInfo.description}
          </span>
        </div>
        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-600 shrink-0">
          {roleInfo.scopeBadge}
        </span>
      </div>
    </div>
  );
});
