import { memo } from "react";
import type { Branch, Employee } from "../types";
import { statusColors } from "../constants";
import { BranchWorkSitesSection } from "./BranchWorkSitesSection";
import { BranchStaffSection } from "./BranchStaffSection";

interface BranchDetailDrawerProps {
  branch: Branch | null;
  employees: Employee[];
  deptGroups: Record<string, Employee[]>;
  empLoading: boolean;
  canManage: boolean;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  userBranchId?: string | null;
  onClose: () => void;
  onOpenEditModal: (branch: Branch) => void;
  onDeleteBranch: (branch: Branch) => void;
  onToggleStatus: (branch: Branch) => void;
}

export const BranchDetailDrawer = memo(function BranchDetailDrawer(props: BranchDetailDrawerProps) {
  if (!props.branch) return null;
  return <BranchDetailDrawerInner {...props} branch={props.branch} />;
});

function BranchDetailDrawerInner({
  branch,
  deptGroups,
  empLoading,
  canManage,
  isAdmin,
  isSuperAdmin = false,
  userBranchId = null,
  onClose,
  onOpenEditModal,
  onDeleteBranch,
  onToggleStatus,
}: BranchDetailDrawerProps & { branch: Branch }) {
  const canManageThisBranch = isSuperAdmin || isAdmin || (canManage && (!userBranchId || branch.id === userBranchId));

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white border-l border-gray-100 overflow-y-auto z-40 flex flex-col shadow-2xl">
      {/* Panel Hero Header */}
      <div className="bg-gradient-to-br from-[#253C7D] to-[#29ABE2] p-6 text-white shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 capitalize">
              {branch.status}
            </span>
            <h2 className="text-lg font-bold mt-2 leading-tight">{branch.name}</h2>
            <p className="text-white/70 text-[13px] mt-1 flex items-center gap-1.5">
              <i className="ri-map-pin-line" />
              {branch.location}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canManageThisBranch && (
              <button
                onClick={() => onOpenEditModal(branch)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
                title="Edit branch"
              >
                <i className="ri-edit-line text-white text-sm" />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onDeleteBranch(branch)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-red-500/80 transition-colors cursor-pointer"
                title="Delete branch"
              >
                <i className="ri-delete-bin-line text-white text-sm" />
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-white" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-xl font-bold">{branch.employee_count}</p>
            <p className="text-[10px] text-white/70 mt-0.5">Employees</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-xl font-bold">{Object.keys(deptGroups).length}</p>
            <p className="text-[10px] text-white/70 mt-0.5">Departments</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <p className="text-[13px] font-bold leading-tight">
              {new Date(branch.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
            <p className="text-[10px] text-white/70 mt-0.5">Est.</p>
          </div>
        </div>
      </div>

      {/* Branch Information */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Branch Info</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#253C7D]/10 text-[#253C7D]">
              <i className="ri-user-star-line text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Branch Manager</p>
              <p className="text-[13px] font-semibold text-gray-800">{branch.manager_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <i className="ri-map-pin-2-line text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Location</p>
              <p className="text-[13px] font-semibold text-gray-800">{branch.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <i className="ri-checkbox-circle-line text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Status</p>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[branch.status] || ""}`}>
                {branch.status}
              </span>
            </div>
          </div>
        </div>

        {canManageThisBranch && (
          <button
            onClick={() => onToggleStatus(branch)}
            className={`w-full mt-4 py-2 rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${
              branch.status === "active"
                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            <i className={branch.status === "active" ? "ri-close-circle-line mr-1" : "ri-checkbox-circle-line mr-1"} />
            {branch.status === "active" ? "Deactivate Branch" : "Reactivate Branch"}
          </button>
        )}
      </div>

      {/* Work Sites Subcomponent */}
      <BranchWorkSitesSection branchId={branch.id} canManage={canManageThisBranch} />

      {/* Staff Breakdown Subcomponent */}
      <BranchStaffSection deptGroups={deptGroups} empLoading={empLoading} />
    </div>
  );
}
