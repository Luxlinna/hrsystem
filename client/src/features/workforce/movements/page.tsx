import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import { MovementsHeader } from "./components/MovementsHeader";
import { MovementsStatsRow } from "./components/MovementsStatsRow";
import { MovementsFilterBar } from "./components/MovementsFilterBar";
import { MovementsTableView } from "./components/MovementsTableView";
import { MovementModal } from "./components/MovementModal";
import { MovementDetailModal } from "./components/MovementDetailModal";
import { recordEmployeeMovement } from "./services/movementService";
import { useMovementsData } from "./hooks/useMovementsData";
import type { EmployeeMovement, MovementType, MovementFormData } from "./types";

export default function MovementsPage() {
  const { user } = useAuth();
  const { selectedBranchId, targetBranch } = useBranchScope();
  const { movements, employees, branches, workLocations, loading, loadData } = useMovementsData();

  // Filters
  const [search, setSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<MovementType | "all">("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  // Sync selected branch with topbar BU
  useEffect(() => {
    const activeBu = selectedBranchId && !selectedBranchId.startsWith("site:") ? selectedBranchId : targetBranch;
    if (activeBu && !selectedBranch) setSelectedBranch(activeBu);
  }, [selectedBranchId, targetBranch, selectedBranch]);

  // Modals
  const [showRecordModal, setShowRecordModal] = useState<boolean>(false);
  const [selectedMovement, setSelectedMovement] = useState<EmployeeMovement | null>(null);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const emp = m.employees;
        const nameMatch = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q) : false;
        const roleMatch = emp?.role?.toLowerCase().includes(q) || false;
        const deptMatch = emp?.department?.toLowerCase().includes(q) || false;
        const idMatch = m.employee_id?.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
        const titleMatch = m.title.toLowerCase().includes(q);

        if (!nameMatch && !roleMatch && !deptMatch && !idMatch && !titleMatch) return false;
      }

      if (selectedType !== "all" && m.movement_type !== selectedType) return false;
      if (selectedBranch && m.branch_id !== selectedBranch && m.employees?.branch_id !== selectedBranch) return false;

      return true;
    });
  }, [movements, search, selectedType, selectedBranch]);

  const handleSaveMovement = async (form: MovementFormData, employee: any) => {
    await recordEmployeeMovement({
      form,
      employee,
      currentUser: {
        id: user?.id,
        email: user?.email,
        displayName: user?.user_metadata?.display_name || user?.email?.split("@")[0],
      },
    });
    await loadData();
  };

  const defaultBranchScope =
    selectedBranch ||
    (selectedBranchId && !selectedBranchId.startsWith("site:") ? selectedBranchId : targetBranch) ||
    "";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in-50">
      <MovementsHeader
        movements={filteredMovements}
        onOpenRecordModal={() => setShowRecordModal(true)}
      />

      <MovementsStatsRow movements={filteredMovements} />

      <MovementsFilterBar
        search={search}
        onSearchChange={setSearch}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        branches={branches}
        totalFiltered={filteredMovements.length}
      />

      {loading ? (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-12 text-center shadow-sm">
          <i className="ri-loader-4-line animate-spin text-2xl text-[#253C7D] dark:text-indigo-400 mb-2 inline-block" />
          <div className="text-xs font-semibold text-gray-500">Loading movement records...</div>
        </div>
      ) : (
        <MovementsTableView
          movements={filteredMovements}
          onSelectMovement={(m) => setSelectedMovement(m)}
        />
      )}

      <MovementModal
        open={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        employees={employees}
        branches={branches}
        workLocations={workLocations}
        onSave={handleSaveMovement}
        defaultBranchId={defaultBranchScope}
      />

      <MovementDetailModal
        movement={selectedMovement}
        onClose={() => setSelectedMovement(null)}
      />
    </div>
  );
}
