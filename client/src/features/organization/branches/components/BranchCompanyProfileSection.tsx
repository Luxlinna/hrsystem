import { memo, useState, useEffect } from "react";
import type { Branch } from "../types";
import { ProfileViewRows } from "./profile/ProfileViewRows";
import { EditCompanyProfileForm } from "./profile/EditCompanyProfileForm";

interface BranchCompanyProfileSectionProps {
  branch: Branch;
  canManage: boolean;
  onOpenEditModal?: (branch: Branch) => void;
  allowedBranches?: Branch[];
  onSelectBranchId?: (id: string) => void;
  hideHeader?: boolean;
}

export const BranchCompanyProfileSection = memo(function BranchCompanyProfileSection({
  branch,
  canManage,
  allowedBranches = [],
  onSelectBranchId,
  hideHeader = false,
}: BranchCompanyProfileSectionProps) {
  const [currentBranch, setCurrentBranch] = useState<Branch>(branch);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setCurrentBranch(branch);
  }, [branch]);

  const handleSaveSuccess = (updated: Branch) => {
    setCurrentBranch(updated);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <EditCompanyProfileForm
        branch={currentBranch}
        onSaveSuccess={handleSaveSuccess}
        onDiscard={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900">
      {/* Top Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-[15px] sm:text-[16px] font-normal text-slate-800 dark:text-slate-100 tracking-tight">
              Company Profile
            </h2>

            {/* BU Switcher dropdown for Super Admins */}
            {allowedBranches.length > 1 && onSelectBranchId && (
              <select
                value={currentBranch.id}
                onChange={(e) => onSelectBranchId(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer focus:outline-none focus:border-[#0088cc] max-w-[180px] truncate"
              >
                {allowedBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[#0088cc] hover:bg-[#0077b3] text-white text-[12.5px] font-medium rounded shadow-2xs transition-colors cursor-pointer w-full sm:w-auto"
            >
              <i className="ri-edit-box-line text-sm" />
              Edit Company Profile
            </button>
          )}
        </div>
      )}

      {/* Structured Read View */}
      <ProfileViewRows
        branch={currentBranch}
        canManage={canManage}
        onOpenEdit={() => setIsEditing(true)}
      />
    </div>
  );
});
