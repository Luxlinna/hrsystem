import { memo } from "react";
import type { Branch, Employee } from "../types";
import { statusColors, deptColors } from "../constants";

interface BranchDetailDrawerProps {
  branch: Branch | null;
  employees: Employee[];
  deptGroups: Record<string, Employee[]>;
  empLoading: boolean;
  canManage: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onOpenEditModal: (branch: Branch) => void;
  onDeleteBranch: (branch: Branch) => void;
  onToggleStatus: (branch: Branch) => void;
}

export const BranchDetailDrawer = memo(function BranchDetailDrawer({
  branch,
  employees,
  deptGroups,
  empLoading,
  canManage,
  isAdmin,
  onClose,
  onOpenEditModal,
  onDeleteBranch,
  onToggleStatus,
}: BranchDetailDrawerProps) {
  if (!branch) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white border-l border-gray-100 overflow-y-auto z-40 flex flex-col shadow-2xl">
      {/* Panel Header */}
      <div className="bg-gradient-to-br from-[#253C7D] to-[#29ABE2] p-6 text-white">
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
            {canManage && (
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

      {/* Branch Info */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Branch Info</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#253C7D]/10">
              <i className="ri-user-star-line text-[#253C7D] text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Branch Manager</p>
              <p className="text-[13px] font-semibold text-gray-800">{branch.manager_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50">
              <i className="ri-map-pin-2-line text-amber-600 text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Location</p>
              <p className="text-[13px] font-semibold text-gray-800">{branch.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-50">
              <i className="ri-checkbox-circle-line text-violet-600 text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Status</p>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[branch.status] || ""}`}>
                {branch.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-50">
              <i className="ri-fingerprint-line text-sky-600 text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Check-In Geofence</p>
              {branch.latitude != null && branch.longitude != null ? (
                <p className="text-[13px] font-semibold text-gray-800">
                  {branch.geofence_radius_m || 100}m radius
                  <span className="text-[11px] font-normal text-gray-400 ml-1">
                    ({branch.latitude.toFixed(5)}, {branch.longitude.toFixed(5)})
                  </span>
                </p>
              ) : (
                <p className="text-[13px] font-semibold text-gray-400">Not set — check-in allowed from anywhere</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50">
              <i className="ri-time-line text-emerald-600 text-sm" />
            </div>
            <div>
              <p className="text-[11px] text-gray-400">Work Schedule</p>
              {branch.work_start_time || branch.work_end_time ? (
                <p className="text-[13px] font-semibold text-gray-800">
                  {branch.work_start_time
                    ? new Date(`2000-01-01T${branch.work_start_time}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                    : "Company default"}
                  {" – "}
                  {branch.work_end_time
                    ? new Date(`2000-01-01T${branch.work_end_time}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                    : "no end time set"}
                </p>
              ) : (
                <p className="text-[13px] font-semibold text-gray-400">Using company default start time, no early-leave check</p>
              )}
            </div>
          </div>
        </div>
        {canManage && (
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

      {/* Department Breakdown */}
      {Object.keys(deptGroups).length > 0 && (
        <div className="p-5 border-b border-gray-100">
          <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Departments</h3>
          <div className="space-y-2">
            {Object.entries(deptGroups).map(([dept, emps], i) => (
              <div key={dept} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${deptColors[i % deptColors.length]}`}>
                    {dept}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#253C7D] rounded-full"
                      style={{ width: `${Math.min((emps.length / employees.length) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-gray-600 font-medium w-6 text-right">{emps.length}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="p-5 flex-1">
        <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Employees {employees.length > 0 && `(${employees.length})`}
        </h3>
        {empLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-10">
            <i className="ri-user-3-line text-3xl text-gray-200" />
            <p className="text-[13px] text-gray-400 mt-2">No employees assigned to this branch</p>
          </div>
        ) : (
          <div className="space-y-2">
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] font-bold text-xs shrink-0">
                  {emp.first_name[0]}
                  {emp.last_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 truncate">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    {emp.role} &middot; {emp.department}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                    emp.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {emp.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
