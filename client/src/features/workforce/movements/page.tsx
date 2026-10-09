import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MovementsHeader } from "./components/MovementsHeader";
import { MovementsFilterBar } from "./components/MovementsFilterBar";
import { MovementsTableView } from "./components/MovementsTableView";
import { CreateChangeStatusModal } from "@/features/workforce/employees/components/CreateChangeStatusModal";
import { ViewEmployeeChangeStatusDetail } from "./components/ViewEmployeeChangeStatusDetail";
import { ImportChangeStatusModal } from "./components/ImportChangeStatusModal";
import { EditMovementInfoModal } from "@/features/workforce/employees/components/overview/movements/EditMovementInfoModal";
import { useMovementsData } from "./hooks/useMovementsData";
import { useMovementsFilter } from "./hooks/useMovementsFilter";
import { deleteMovement, deleteMovements } from "./services/movementService";
import { toast } from "@/components/Toast";
import type { EmployeeMovement } from "./types";

export default function MovementsPage() {
  const navigate = useNavigate();
  const {
    movements, employees, branches, workLocations, departments,
    divisions, positions, employeeTypes, employeeLevels,
    contractTypes, jobStatuses, loading, loadData,
  } = useMovementsData();

  const [search, setSearch] = useState<string>("");
  const [filterDateOption, setFilterDateOption] = useState<string>("all");
  const [filterContractType, setFilterContractType] = useState<string[]>([]);
  const [filterJobStatus, setFilterJobStatus] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [filterBranch, setFilterBranch] = useState<string>("");
  const [filterWorkLocation, setFilterWorkLocation] = useState<string>("all");
  const [filterDivision, setFilterDivision] = useState<string>("");
  const [filterDept, setFilterDept] = useState<string>("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterEmployeeType, setFilterEmployeeType] = useState<string>("");
  const [filterEmployeeLevel, setFilterEmployeeLevel] = useState<string>("");
  const [showSalary, setShowSalary] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingBulk, setDeletingBulk] = useState<boolean>(false);

  const [showRecordModal, setShowRecordModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [selectedMovement, setSelectedMovement] = useState<EmployeeMovement | null>(null);
  const [editingMovement, setEditingMovement] = useState<EmployeeMovement | null>(null);

  const filteredMovements = useMovementsFilter({
    movements, search, selectedStatus, filterDateOption,
    filterContractType, filterJobStatus, filterBranch, filterWorkLocation,
    filterDivision, filterDept, filterRole, filterEmployeeType, filterEmployeeLevel,
  });

  const allSelected = filteredMovements.length > 0 && filteredMovements.every((m) => selectedIds.has(m.id));
  const isIndeterminate = selectedIds.size > 0 && !allSelected;

  const handleSelectAll = useCallback(() => {
    if (allSelected || selectedIds.size > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMovements.map((m) => m.id)));
    }
  }, [allSelected, selectedIds.size, filteredMovements]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleDelete = async (m: EmployeeMovement) => {
    await deleteMovement(m.id);
    toast("Record Deleted", "Change status record deleted successfully.", "success");
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(m.id);
      return next;
    });
    await loadData();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${count} selected change status record${count === 1 ? "" : "s"}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingBulk(true);
    try {
      await deleteMovements(Array.from(selectedIds));
      toast("Records Deleted", `${count} change status record${count === 1 ? "" : "s"} deleted successfully.`, "success");
      setSelectedIds(new Set());
      await loadData();
    } catch (err) {
      console.error("Bulk delete error:", err);
      toast("Delete Failed", "Failed to delete selected change status records.", "error");
    } finally {
      setDeletingBulk(false);
    }
  };

  if (selectedMovement) {
    return (
      <ViewEmployeeChangeStatusDetail
        movement={selectedMovement}
        onBack={() => setSelectedMovement(null)}
      />
    );
  }

  const editEmp = editingMovement?.employees ? (editingMovement.employees as any) : employees[0] || {};

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 font-sans">
      <MovementsHeader
        movements={filteredMovements}
        onOpenRecordModal={() => setShowRecordModal(true)}
        onOpenSettings={() => navigate("/employees/settings")}
      />

      <MovementsFilterBar
        search={search} onSearchChange={setSearch}
        selectedStatus={selectedStatus} onStatusChange={setSelectedStatus}
        showSalary={showSalary} onToggleSalary={() => setShowSalary(!showSalary)}
        onOpenImport={() => setShowImportModal(true)}
        movements={filteredMovements}
        filterDateOption={filterDateOption} onDateOptionChange={setFilterDateOption}
        filterContractType={filterContractType} onContractTypeChange={setFilterContractType}
        filterJobStatus={filterJobStatus} onJobStatusChange={setFilterJobStatus}
        contractTypes={contractTypes} jobStatuses={jobStatuses}
        filterBranch={filterBranch} onBranchChange={setFilterBranch}
        filterWorkLocation={filterWorkLocation} onWorkLocationChange={setFilterWorkLocation}
        filterDivision={filterDivision} onDivisionChange={setFilterDivision}
        filterDept={filterDept} onDeptChange={setFilterDept}
        filterRole={filterRole} onRoleChange={setFilterRole}
        filterEmployeeType={filterEmployeeType} onEmployeeTypeChange={setFilterEmployeeType}
        filterEmployeeLevel={filterEmployeeLevel} onEmployeeLevelChange={setFilterEmployeeLevel}
        branches={branches as any} workSites={workLocations as any}
        divisions={divisions} depts={departments} positions={positions}
        employeeTypes={employeeTypes} employeeLevels={employeeLevels}
        selectedCount={selectedIds.size}
        onBulkDelete={handleBulkDelete}
        isDeleting={deletingBulk}
      />

      {selectedIds.size > 0 && (
        <div className="bg-[#253C7D]/8 dark:bg-[#253C7D]/20 border border-[#253C7D]/25 dark:border-[#253C7D]/40 rounded px-4 py-2.5 my-3 flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <i className="ri-checkbox-multiple-line text-[#253C7D] dark:text-blue-300 text-sm" />
            <span className="text-xs font-semibold text-[#253C7D] dark:text-blue-200">
              {selectedIds.size} change status record{selectedIds.size === 1 ? "" : "s"} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={deletingBulk}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-rose-300 dark:border-rose-500/50 text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 text-xs font-medium rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <i className="ri-delete-bin-line text-xs" />
              <span>{deletingBulk ? "Deleting..." : `Delete Selected (${selectedIds.size})`}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 text-xs font-medium rounded hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shadow-2xs"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border-t border-slate-100 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading change status records...
          </div>
        ) : (
          <MovementsTableView
            movements={filteredMovements}
            selectedIds={selectedIds}
            selectAll={allSelected}
            isIndeterminate={isIndeterminate}
            showSalary={showSalary}
            onSelectAll={handleSelectAll}
            onSelectOne={handleSelectOne}
            onSelectMovement={(m) => setSelectedMovement(m)}
            onEditMovement={(m) => setEditingMovement(m)}
            onDeleteMovement={handleDelete}
          />
        )}
      </div>

      <CreateChangeStatusModal isOpen={showRecordModal} onClose={() => setShowRecordModal(false)} employees={employees} branches={branches} onSuccess={loadData} />
      <ImportChangeStatusModal isOpen={showImportModal} onClose={() => setShowImportModal(false)} employees={employees} branches={branches} workLocations={workLocations} movements={movements} onSuccess={loadData} />
      {editingMovement && (
        <EditMovementInfoModal open={Boolean(editingMovement)} onClose={() => setEditingMovement(null)} employee={editEmp} movement={editingMovement} onSaved={() => { setEditingMovement(null); loadData(); }} />
      )}
    </div>
  );
}
