import React, { useState, useEffect, useCallback } from "react";
import type { Employee } from "../../types";
import { fetchMovementsByEmployeeId, recordEmployeeMovement } from "@/pages/movements/services/movementService";
import type { EmployeeMovement, MovementFormData } from "@/pages/movements/types";
import { MOVEMENT_TYPES } from "@/pages/movements/constants";
import { MovementModal } from "@/pages/movements/components/MovementModal";
import { MovementDetailModal } from "@/pages/movements/components/MovementDetailModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface MovementInfoCardProps {
  employee: Employee;
}

export const MovementInfoCard: React.FC<MovementInfoCardProps> = ({ employee }) => {
  const { user } = useAuth();
  const [movements, setMovements] = useState<EmployeeMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedMovement, setSelectedMovement] = useState<EmployeeMovement | null>(null);

  // Reference data for modal
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [workLocations, setWorkLocations] = useState<{ id: string; name: string; branch_id?: string }[]>([]);

  const loadEmployeeMovements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMovementsByEmployeeId(employee.id);
      setMovements(data);
    } catch (err) {
      console.warn("Could not load employee movements:", err);
    } finally {
      setLoading(false);
    }
  }, [employee.id]);

  useEffect(() => {
    loadEmployeeMovements();

    // Fetch branches and locations for modal
    supabase.from("branches").select("id, name").is("deleted_at", null).then(({ data }) => {
      if (data) setBranches(data);
    });
    supabase.from("work_locations").select("id, name, branch_id").then(({ data }) => {
      if (data) setWorkLocations(data);
    });

    const handleCreated = () => {
      loadEmployeeMovements();
    };
    window.addEventListener("employee-movement-created", handleCreated);
    return () => window.removeEventListener("employee-movement-created", handleCreated);
  }, [loadEmployeeMovements]);

  const handleSaveMovement = async (form: MovementFormData, emp: any) => {
    await recordEmployeeMovement({
      form,
      employee: emp,
      currentUser: {
        id: user?.id,
        email: user?.email,
        displayName: user?.user_metadata?.display_name || user?.email?.split("@")[0],
      },
    });
    await loadEmployeeMovements();
  };

  const joinDate = employee.join_date ? new Date(employee.join_date).toLocaleDateString() : "Not specified";
  const isExited = employee.status === "resigned" || employee.status === "terminated" || employee.status === "inactive";
  const statusColor =
    employee.status === "active"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : employee.status === "onboarding" || employee.status === "probation"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-[#253C7D] dark:text-indigo-400">
            <i className="ri-route-line text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Movement &amp; Career Lifecycle</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Audit timeline of promotions, transfers, salary revisions, and contracts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor} capitalize`}>
            Status: {employee.status || "Active"}
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#253C7D] hover:bg-[#1e3064] text-white text-xs font-bold shadow-xs transition-all"
          >
            <i className="ri-add-line" />
            <span>Record Movement</span>
          </button>
        </div>
      </div>

      {/* Timeline Progression */}
      <div className="relative pl-6 border-l-2 border-indigo-100 dark:border-slate-700 space-y-6 ml-2">
        {/* Baseline Step 1: Onboarding & Join */}
        <div className="relative">
          <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#253C7D] ring-4 ring-indigo-50 dark:ring-indigo-950" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 dark:text-white">Onboarding &amp; Initial Join Date</span>
            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 px-2 py-0.5 rounded">
              {joinDate}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Joined as <strong>{employee.role || "Staff"}</strong> in the <strong>{employee.department || "General"}</strong> department.
          </p>
        </div>

        {/* Dynamic Recorded Movements */}
        {movements.map((m) => {
          const typeCfg = MOVEMENT_TYPES[m.movement_type];
          return (
            <div key={m.id} className="relative group">
              <div
                className="absolute -left-[31px] top-0 w-4 h-4 rounded-full ring-4 ring-white dark:ring-slate-800 transition-all group-hover:scale-110"
                style={{ backgroundColor: typeCfg?.accentColor || "#253C7D" }}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{m.title}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      typeCfg ? `${typeCfg.badgeBg} ${typeCfg.badgeText} ${typeCfg.badgeBorder}` : ""
                    }`}
                  >
                    {typeCfg?.label || m.movement_type}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 px-2 py-0.5 rounded">
                    {m.effective_date}
                  </span>
                  <button
                    onClick={() => setSelectedMovement(m)}
                    className="text-[10px] text-[#253C7D] dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Details
                  </button>
                </div>
              </div>

              {/* Changes preview */}
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 space-y-1">
                {m.remarks && <p className="italic text-gray-500">"{m.remarks}"</p>}
                {m.document_url && (
                  <div className="pt-1">
                    <a
                      href={m.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-[#253C7D] dark:text-indigo-300 hover:underline text-[11px] font-medium"
                    >
                      <i className="ri-attachment-2" />
                      <span>{m.document_name || "Supporting File"}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Current Placement & Location */}
        <div className="relative">
          <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-blue-50 dark:ring-blue-950" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 dark:text-white">Current Work Assignment</span>
            <span className="text-[11px] text-blue-600 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded font-semibold">
              {employee.branches?.name || "Main Headquarters"}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            Assigned Site: {employee.work_locations?.name || "Standard Facility"} &middot; Biometric ID: {employee.biometric_user_id || "Unassigned"}
          </p>
        </div>

        {/* Lifecycle Milestone */}
        <div className="relative">
          <div
            className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full ${
              isExited ? "bg-amber-500 ring-amber-50" : "bg-emerald-500 ring-emerald-50"
            } ring-4`}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-900 dark:text-white">
              {isExited ? "Exit / Separation Milestone" : "Active Service Record"}
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded font-semibold ${
                isExited
                  ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              }`}
            >
              {isExited ? "Separated" : "In Good Standing"}
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
            {isExited
              ? "Staff has completed exit clearance and offboarding handover."
              : "Active staff member with regular attendance and ongoing employment contract."}
          </p>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-gray-50 dark:bg-slate-900/60 p-2.5 rounded-lg">
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Join Date</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">{joinDate}</span>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/60 p-2.5 rounded-lg">
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Department</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">{employee.department || "—"}</span>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/60 p-2.5 rounded-lg">
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Position</span>
          <span className="font-bold text-gray-800 dark:text-gray-200">{employee.role || "—"}</span>
        </div>
        <div className="bg-gray-50 dark:bg-slate-900/60 p-2.5 rounded-lg">
          <span className="text-gray-400 block text-[10px] uppercase font-semibold">Total Movements</span>
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{movements.length} Logged</span>
        </div>
      </div>

      {/* Movement Modal for this employee */}
      <MovementModal
        open={showModal}
        onClose={() => setShowModal(false)}
        employees={[employee]}
        branches={branches}
        workLocations={workLocations}
        onSave={handleSaveMovement}
        preselectedEmployeeId={employee.id}
      />

      {/* Movement Detail Modal */}
      <MovementDetailModal
        movement={selectedMovement}
        onClose={() => setSelectedMovement(null)}
      />
    </div>
  );
};
