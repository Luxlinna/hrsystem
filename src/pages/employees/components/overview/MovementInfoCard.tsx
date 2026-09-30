import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { Employee } from "../../types";
import { fetchMovementsByEmployeeId } from "@/pages/movements/services/movementService";
import type { EmployeeMovement } from "@/pages/movements/types";
import { EmployeeMovementCard } from "./movements/EmployeeMovementCard";
import { EmployeeMovementAttachmentSection } from "./movements/EmployeeMovementAttachmentSection";
import { buildInitialEmploymentRecord } from "./movements/movementDisplayUtils";
import { EditMovementInfoModal } from "./movements/EditMovementInfoModal";

interface MovementInfoCardProps {
  employee: Employee;
}

export const MovementInfoCard: React.FC<MovementInfoCardProps> = ({ employee }) => {
  const [movements, setMovements] = useState<EmployeeMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [privacyHidden, setPrivacyHidden] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [editingMovement, setEditingMovement] = useState<EmployeeMovement | null>(null);

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
    const handleCreated = () => loadEmployeeMovements();
    window.addEventListener("employee-movement-created", handleCreated);
    return () => window.removeEventListener("employee-movement-created", handleCreated);
  }, [loadEmployeeMovements]);

  const handleMovementSaved = (updated: EmployeeMovement) => {
    setMovements((prev) => {
      const exists = prev.some((m) => m.id === updated.id);
      if (exists) {
        return prev.map((m) => (m.id === updated.id ? updated : m));
      }
      return [updated, ...prev];
    });
    loadEmployeeMovements();
  };

  const displayMovements = useMemo(() => {
    if (movements.length > 0) return movements;
    return buildInitialEmploymentRecord(employee);
  }, [movements, employee]);

  const totalCount = displayMovements.length;
  const pagedList = displayMovements.slice(0, visibleCount);
  const currentShown = pagedList.length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-sm sm:rounded-md p-5 sm:p-6 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          EMPLOYEE MOVEMENT INFO
        </h3>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingMovement(displayMovements[0] || null);
              setShowEditModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-sky-400 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs transition-colors cursor-pointer"
          >
            <i className="ri-edit-box-line text-xs" />
            <span>Edit Movement</span>
          </button>

          <button
            type="button"
            onClick={() => setPrivacyHidden((prev) => !prev)}
            className="px-3.5 py-1 rounded-full border border-sky-400 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 text-xs transition-colors cursor-pointer"
          >
            <span>{privacyHidden ? "Show Privacy" : "Hide Privacy"}</span>
          </button>
        </div>
      </div>

      {/* Movements List */}
      {loading && movements.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">Loading movements...</div>
      ) : displayMovements.length === 0 ? (
        <div className="text-center py-6 bg-gray-50/50 dark:bg-slate-800/40 rounded border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
          No movements recorded for this employee
        </div>
      ) : (
        <div className="space-y-4">
          {pagedList.map((m, idx) => (
            <EmployeeMovementCard
              key={m.id || idx}
              movement={m}
              employee={employee}
              isCurrent={m.title?.toLowerCase() === "join" || idx === pagedList.length - 1}
              privacyHidden={privacyHidden}
              onClickDetails={(item) => {
                setEditingMovement(item);
                setShowEditModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between pt-1 text-xs text-gray-500 dark:text-slate-400">
          {visibleCount < totalCount ? (
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.min(prev + 5, totalCount))}
              className="text-sky-600 dark:text-sky-400 font-semibold hover:underline cursor-pointer"
            >
              Load More
            </button>
          ) : (
            <div />
          )}
          <span className="font-normal text-slate-500">
            {currentShown} of {totalCount}
          </span>
        </div>
      )}

      {/* Attachment Info Section */}
      <EmployeeMovementAttachmentSection
        employee={employee}
        movements={displayMovements}
        categoryKey="movement"
      />

      {/* Edit Movement Info Modal */}
      <EditMovementInfoModal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        employee={employee}
        movement={editingMovement}
        onSaved={handleMovementSaved}
      />
    </div>
  );
};
