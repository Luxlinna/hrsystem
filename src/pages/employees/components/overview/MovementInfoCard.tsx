import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { Employee } from "../../types";
import { fetchMovementsByEmployeeId, recordEmployeeMovement } from "@/pages/movements/services/movementService";
import type { EmployeeMovement, MovementFormData } from "@/pages/movements/types";
import { MovementModal } from "@/pages/movements/components/MovementModal";
import { MovementDetailModal } from "@/pages/movements/components/MovementDetailModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { EmployeeMovementCard } from "./movements/EmployeeMovementCard";
import { EmployeeMovementAttachmentSection } from "./movements/EmployeeMovementAttachmentSection";
import { buildFallbackMovements } from "./movements/movementDisplayUtils";

interface MovementInfoCardProps {
  employee: Employee;
}

export const MovementInfoCard: React.FC<MovementInfoCardProps> = ({ employee }) => {
  const { user } = useAuth();
  const [movements, setMovements] = useState<EmployeeMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [privacyHidden, setPrivacyHidden] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(5);
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
    supabase.from("branches").select("id, name").is("deleted_at", null).then(({ data }) => {
      if (data) setBranches(data);
    });
    supabase.from("work_locations").select("id, name, branch_id").then(({ data }) => {
      if (data) setWorkLocations(data);
    });

    const handleCreated = () => loadEmployeeMovements();
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

  const displayMovements = useMemo(() => {
    if (movements.length > 0) return movements;
    return buildFallbackMovements(employee);
  }, [movements, employee]);

  const totalCount = displayMovements.length;
  const pagedList = displayMovements.slice(0, visibleCount);
  const currentShown = pagedList.length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
        <h3 className="text-xs sm:text-sm font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          EMPLOYEE MOVEMENT INFO
        </h3>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border border-sky-500 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
          >
            <i className="ri-edit-box-line" />
            <span>Edit Movement</span>
          </button>

          <button
            type="button"
            onClick={() => setPrivacyHidden((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white transition-colors cursor-pointer shadow-2xs"
          >
            <span>{privacyHidden ? "Hide Privacy" : "Show Privacy"}</span>
          </button>
        </div>
      </div>

      {/* Movement Cards List */}
      <div className="space-y-4">
        {pagedList.map((m, idx) => (
          <EmployeeMovementCard
            key={m.id || idx}
            movement={m}
            employee={employee}
            isCurrent={idx === 0}
            privacyHidden={privacyHidden}
            onClickDetails={setSelectedMovement}
          />
        ))}
      </div>

      {/* Load More Pagination */}
      <div className="flex items-center justify-between pt-2 text-xs text-gray-500 dark:text-slate-400">
        {visibleCount < totalCount ? (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => Math.min(prev + 5, totalCount))}
            className="text-sky-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
          >
            Load More
          </button>
        ) : (
          <span className="text-gray-400">All loaded</span>
        )}
        <span className="font-medium">
          {currentShown} of {totalCount}
        </span>
      </div>

      {/* Attachment Info Section */}
      <EmployeeMovementAttachmentSection employee={employee} />

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
