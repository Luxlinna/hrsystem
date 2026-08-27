import { memo } from "react";

interface BranchesHeaderProps {
  canManage: boolean;
  activeBranches: number;
  totalEmployees: number;
  onOpenAddModal: () => void;
}

export const BranchesHeader = memo(function BranchesHeader({
  canManage,
  activeBranches,
  totalEmployees,
  onOpenAddModal,
}: BranchesHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Workspace</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Branch Management</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Branch Management
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {activeBranches} active branches &middot; {totalEmployees.toLocaleString()} total employees
        </p>
      </div>
      {canManage && (
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-[#1E3066] transition-all shadow-md shadow-[#253C7D]/20 whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line" />
          Add Branch
        </button>
      )}
    </div>
  );
});
