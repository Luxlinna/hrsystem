import { memo } from "react";
import { Link } from "react-router-dom";
import { ADMIN_ACTIONS } from "../constants";

interface AdminActionsSectionProps {
  can: (module: string) => boolean;
}

export const AdminActionsSection = memo(function AdminActionsSection({
  can,
}: AdminActionsSectionProps) {
  const allowedActions = ADMIN_ACTIONS.filter((item) => can(item.module));

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Administrative Actions</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Quick access to core HR modules and operations</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {allowedActions.map((item) => (
          <Link
            key={item.label}
            to={item.path}
            className="flex flex-col items-center gap-2 bg-gray-50 hover:bg-[#253C7D]/5 border border-gray-100 hover:border-[#253C7D]/20 rounded-xl px-5 py-4 w-[100px] transition-colors group"
          >
            <i
              className={`${item.icon} text-lg text-gray-600 group-hover:text-[#253C7D] w-6 h-6 flex items-center justify-center transition-colors`}
            />
            <span className="text-[11px] font-medium text-gray-600 group-hover:text-[#253C7D] transition-colors whitespace-nowrap">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
});
