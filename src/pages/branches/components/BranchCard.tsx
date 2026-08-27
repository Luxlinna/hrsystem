import { memo } from "react";
import type { Branch } from "../types";
import { statusColors } from "../constants";

interface BranchCardProps {
  branch: Branch;
  isSelected: boolean;
  isAdmin: boolean;
  onSelect: (branch: Branch) => void;
  onDelete: (branch: Branch) => void;
}

export const BranchCard = memo(function BranchCard({
  branch,
  isSelected,
  isAdmin,
  onSelect,
  onDelete,
}: BranchCardProps) {
  return (
    <div
      className={`bg-white border rounded-2xl shadow-2xs hover:shadow-xs p-5 transition-all cursor-pointer hover:border-[#253C7D]/30 ${
        isSelected ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
      }`}
      onClick={() => onSelect(branch)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#253C7D]/10 flex items-center justify-center">
            <i className="ri-building-2-line text-[#253C7D] text-lg" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-gray-900 leading-tight">{branch.name}</p>
            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
              <i className="ri-map-pin-line" />
              {branch.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
              statusColors[branch.status] || "bg-gray-50 text-gray-500"
            }`}
          >
            {branch.status}
          </span>
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(branch);
              }}
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Delete branch"
            >
              <i className="ri-delete-bin-line text-xs" />
            </button>
          )}
        </div>
      </div>

      <div className="border-t border-gray-50 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
            <i className="ri-user-star-line" /> Manager
          </span>
          <span className="text-[12px] font-medium text-gray-700">{branch.manager_name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
            <i className="ri-team-line" /> Employees
          </span>
          <span className="text-[13px] font-bold text-[#253C7D]">{branch.employee_count}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
            <i className="ri-calendar-line" /> Since
          </span>
          <span className="text-[12px] text-gray-600">
            {new Date(branch.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </span>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(branch);
        }}
        className="mt-4 w-full py-2 border border-gray-200 text-gray-600 text-[12px] font-medium rounded-lg hover:bg-[#253C7D] hover:text-white hover:border-[#253C7D] transition-all cursor-pointer"
      >
        View Details <i className="ri-arrow-right-line ml-1" />
      </button>
    </div>
  );
});
