import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { Employee } from "../../types";
import { fetchMovementsByEmployeeId } from "@/pages/movements/services/movementService";
import type { EmployeeMovement } from "@/pages/movements/types";
import { EmployeeMovementCard } from "./movements/EmployeeMovementCard";
import { EmployeeMovementAttachmentSection } from "./movements/EmployeeMovementAttachmentSection";
import { buildInitialEmploymentRecord } from "./movements/movementDisplayUtils";
import { EditMovementInfoModal } from "./movements/EditMovementInfoModal";
import { ApplyMovementModal } from "./movements/ApplyMovementModal";

interface MovementInfoCardProps {
  employee: Employee;
}

export const MovementInfoCard: React.FC<MovementInfoCardProps> = ({ employee }) => {
  const [movements, setMovements] = useState<EmployeeMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [privacyHidden, setPrivacyHidden] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(5);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);
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
    const initialRec = buildInitialEmploymentRecord(employee);
    return initialRec ? [initialRec] : [];
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
            onClick={() => setShowApplyModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-[#253C7D] hover:bg-[#1d2f60] text-white transition-colors cursor-pointer shadow-2xs"
          >
            <i className="ri-add-line" />
            <span>Apply Movement</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingMovement(displayMovements[0] || null);
              setShowEditModal(true);
            }}
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

      {/* Loading & Movements List */}
      {loading && movements.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">Loading movements...</div>
      ) : displayMovements.length === 0 ? (
        <div className="text-center py-8 bg-gray-50/50 dark:bg-slate-800/40 rounded-lg border border-dashed border-gray-200 dark:border-slate-700">
          <i className="ri-route-line text-2xl text-gray-400 mb-1.5 block" />
          <p className="text-xs font-semibold text-gray-600 dark:text-slate-300">
            No movements recorded for this employee
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Click "Apply Movement" to record a promotion, transfer, or salary adjustment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pagedList.map((m, idx) => (
            <EmployeeMovementCard
              key={m.id || idx}
              movement={m}
              employee={employee}
              isCurrent={idx === 0}
              privacyHidden={privacyHidden}
              onClickDetails={(item) => {
                setEditingMovement(item);
                setShowEditModal(true);
              }}
            />
          ))}
        </div>
      )}

      {/* Load More Pagination */}
      {totalCount > 0 && (
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
      )}

      {/* Attachment Info Section */}
      <EmployeeMovementAttachmentSection employee={employee} movements={displayMovements} />

      {/* Apply Movement Modal */}
      <ApplyMovementModal
        open={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        employee={employee}
        onSaved={handleMovementSaved}
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
