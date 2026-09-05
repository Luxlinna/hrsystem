import { memo } from "react";
import type { Branch, Employee } from "../types";
import { statusColors } from "../constants";
import { BranchWorkSitesSection } from "./BranchWorkSitesSection";
import { BranchBiometricsSection } from "./BranchBiometricsSection";
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
                title="Edit BU"
              >
                <i className="ri-edit-line text-white text-sm" />
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => onDeleteBranch(branch)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-red-500/80 transition-colors cursor-pointer"
                title="Delete BU"
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
            {branch.status === "active" ? "Deactivate BU" : "Reactivate BU"}
          </button>
        )}
      </div>

      {/* Schedule & Grace Policy Section */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <i className="ri-time-line text-[#253C7D] text-sm" />
            <h3 className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
              Schedule & Grace Policy
            </h3>
          </div>
          {canManageThisBranch && (
            <button
              onClick={() => onOpenEditModal(branch)}
              className="text-[11px] font-bold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded-md border border-gray-200 shadow-2xs"
              title="Adjust check-in/out and grace minutes"
            >
              <i className="ri-edit-line text-xs" />
              Adjust
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[#253C7D] mb-1">
              <i className="ri-login-circle-line text-xs" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Check-In</span>
            </div>
            <p className="text-sm font-bold text-gray-900">
              {branch.work_start_time ? branch.work_start_time.slice(0, 5) : "08:00"}
            </p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <i className="ri-shield-check-line text-xs shrink-0" />
              <span>+{branch.late_grace_minutes ?? 15}m late chance</span>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs">
            <div className="flex items-center gap-1.5 text-[#253C7D] mb-1">
              <i className="ri-logout-circle-line text-xs" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Check-Out</span>
            </div>
            <p className="text-sm font-bold text-gray-900">
              {branch.work_end_time ? branch.work_end_time.slice(0, 5) : "17:00"}
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1 flex items-center gap-1">
              <i className="ri-timer-line text-xs shrink-0" />
              <span>{branch.early_leave_grace_minutes ?? 15}m early grace</span>
            </p>
          </div>
        </div>

        <div className="mt-2.5 text-[11px] text-gray-500 bg-white/80 p-2.5 rounded-lg border border-gray-100 flex items-start gap-1.5">
          <i className="ri-information-line text-[#253C7D] text-xs mt-0.5 shrink-0" />
          <span>
            Employees arriving within <strong className="text-gray-700 font-semibold">{branch.late_grace_minutes ?? 15} mins</strong> after check-in are granted a chance and marked On Time.
          </span>
        </div>
      </div>

      {/* Work Sites Subcomponent */}
      <BranchWorkSitesSection branchId={branch.id} canManage={canManageThisBranch} />

      {/* Biometric Fingerprint Machines Subcomponent */}
      <BranchBiometricsSection branchId={branch.id} branchName={branch.name} canManage={canManageThisBranch} />

      {/* Staff Breakdown Subcomponent */}
      <BranchStaffSection deptGroups={deptGroups} empLoading={empLoading} />
    </div>
  );
}
