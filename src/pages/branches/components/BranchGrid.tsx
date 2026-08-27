import { memo } from "react";
import type { Branch } from "../types";
import { BranchCard } from "./BranchCard";

interface BranchGridProps {
  branches: Branch[];
  selectedBranchId: string | null;
  isAdmin: boolean;
  onSelectBranch: (branch: Branch) => void;
  onDeleteBranch: (branch: Branch) => void;
}

export const BranchGrid = memo(function BranchGrid({
  branches,
  selectedBranchId,
  isAdmin,
  onSelectBranch,
  onDeleteBranch,
}: BranchGridProps) {
  if (branches.length === 0) {
    return (
      <div className="text-center py-20 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
          <i className="ri-building-2-line text-2xl text-gray-300" />
        </div>
        <p className="text-sm font-bold text-gray-700">No branches match your search</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or status filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {branches.map((b) => (
        <BranchCard
          key={b.id}
          branch={b}
          isSelected={selectedBranchId === b.id}
          isAdmin={isAdmin}
          onSelect={onSelectBranch}
          onDelete={onDeleteBranch}
        />
      ))}
    </div>
  );
});
