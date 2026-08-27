import { memo } from "react";
import { Link } from "react-router-dom";

interface EmployeesHeaderProps {
  branchCount: number;
  canManage: boolean;
  onOpenAddModal: () => void;
}

export const EmployeesHeader = memo(function EmployeesHeader({
  branchCount,
  canManage,
  onOpenAddModal,
}: EmployeesHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Workspace</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Employee Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">Employee Directory</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Manage your workforce across {branchCount} location{branchCount === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        {canManage && (
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1E3066] transition-all shadow-md shadow-[#253C7D]/20 cursor-pointer"
          >
            <i className="ri-user-add-line text-lg" />
            Add Employee
          </button>
        )}
        <Link
          to="/hire"
          className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all border border-gray-200/80 shadow-2xs cursor-pointer"
        >
          <i className="ri-user-search-line text-lg" />
          Hire New
        </Link>
      </div>
    </div>
  );
});
