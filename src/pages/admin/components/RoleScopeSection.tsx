import { memo } from "react";
import type { RoleFormState } from "../types";
import { SCOPE_OVERRIDES } from "../constants";

interface RoleScopeSectionProps {
  roleForm: RoleFormState;
  setRoleForm: React.Dispatch<React.SetStateAction<RoleFormState>>;
}

export const RoleScopeSection = memo(function RoleScopeSection({
  roleForm,
  setRoleForm,
}: RoleScopeSectionProps) {
  const sections = [
    {
      group: "action",
      title: "Approval & Action Permissions",
      caption: "What this role may DO to other people's records. Grant deliberately.",
    },
    {
      group: "visibility",
      title: "Data Visibility Overrides",
      caption: "What this role may SEE beyond its own record. Seeing is not deciding.",
    },
  ] as const;

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const items = SCOPE_OVERRIDES.filter((o) => o.group === section.group);
        const grantedCount = items.filter((o) => roleForm[o.key]).length;
        const isAction = section.group === "action";

        return (
          <div key={section.group}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-600">{section.title}</label>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  grantedCount > 0
                    ? "bg-[#253C7D]/10 text-[#253C7D]"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {grantedCount} / {items.length} granted
              </span>
            </div>
            <p className="text-[11px] text-gray-500 mb-2">{section.caption}</p>

            <div className={`space-y-2 pr-1 ${isAction ? "" : "max-h-56 overflow-y-auto"}`}>
              {items.map((o) => {
                const checked = roleForm[o.key];
                return (
                  <div
                    key={o.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                      checked
                        ? "bg-[#253C7D]/5 border-[#253C7D]/25"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      id={o.key}
                      checked={checked}
                      onChange={(e) => setRoleForm((p) => ({ ...p, [o.key]: e.target.checked }))}
                      className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-[#253C7D] shrink-0"
                    />
                    <label htmlFor={o.key} className="text-sm font-medium text-gray-800 cursor-pointer">
                      {o.label}
                      <span className="block text-xs font-normal text-gray-500 mt-0.5">{o.hint}</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
});
