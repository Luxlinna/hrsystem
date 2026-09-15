import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import { MovementsHeader } from "./components/MovementsHeader";
import { MovementsStatsRow } from "./components/MovementsStatsRow";
import { MovementsFilterBar } from "./components/MovementsFilterBar";
import { MovementsTableView } from "./components/MovementsTableView";
import { MovementModal } from "./components/MovementModal";
import { MovementDetailModal } from "./components/MovementDetailModal";
import { fetchAllMovements, recordEmployeeMovement } from "./services/movementService";
import type { EmployeeMovement, MovementType, MovementFormData } from "./types";

export default function MovementsPage() {
  const { user } = useAuth();
  const { selectedBranchId, targetBranch } = useBranchScope();
  const [movements, setMovements] = useState<EmployeeMovement[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [workLocations, setWorkLocations] = useState<{ id: string; name: string; branch_id?: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [selectedType, setSelectedType] = useState<MovementType | "all">("all");
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  // Sync selected branch with topbar BU
  useEffect(() => {
    const activeBu = selectedBranchId && !selectedBranchId.startsWith("site:") ? selectedBranchId : targetBranch;
    if (activeBu && !selectedBranch) {
      setSelectedBranch(activeBu);
    }
  }, [selectedBranchId, targetBranch, selectedBranch]);

  // Modals
  const [showRecordModal, setShowRecordModal] = useState<boolean>(false);
  const [selectedMovement, setSelectedMovement] = useState<EmployeeMovement | null>(null);

  // Fetch initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Movements
      const movementsData = await fetchAllMovements();
      setMovements(movementsData);

      // 2. Fetch Employees
      const { data: empData, error: empErr } = await supabase
        .from("employees")
        .select(`
          id,
          first_name,
          last_name,
          role,
          department,
          avatar_url,
          branch_id,
          status,
          branches ( name ),
          work_locations ( name )
        `)
        .is("deleted_at", null)
        .order("first_name");

      if (empErr) console.warn("Failed to fetch employees:", empErr);
      if (empData) setEmployees(empData);

      // 3. Fetch Branches
      const { data: branchData } = await supabase
        .from("branches")
        .select("id, name")
        .is("deleted_at", null)
        .order("name");
      if (branchData) setBranches(branchData);

      // 4. Fetch Work Locations
      const { data: locData } = await supabase
        .from("work_locations")
        .select("id, name, branch_id")
        .order("name");
      if (locData) setWorkLocations(locData);
    } catch (err) {
      console.error("Error loading movements page data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen for custom movement created events
    const handleCreated = () => {
      loadData();
    };
    window.addEventListener("employee-movement-created", handleCreated);
    return () => window.removeEventListener("employee-movement-created", handleCreated);
  }, [loadData]);

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // 1. Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const emp = m.employees;
        const nameMatch = emp
          ? `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(q)
          : false;
        const roleMatch = emp?.role?.toLowerCase().includes(q) || false;
        const deptMatch = emp?.department?.toLowerCase().includes(q) || false;
        const idMatch = m.employee_id?.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
        const titleMatch = m.title.toLowerCase().includes(q);

        if (!nameMatch && !roleMatch && !deptMatch && !idMatch && !titleMatch) {
          return false;
        }
      }

      // 2. Movement Type filter
      if (selectedType !== "all" && m.movement_type !== selectedType) {
        return false;
      }

      // 3. Branch filter
      if (selectedBranch && m.branch_id !== selectedBranch && m.employees?.branch_id !== selectedBranch) {
        return false;
      }

      return true;
    });
  }, [movements, search, selectedType, selectedBranch]);

  const prioritizedEmployees = useMemo(() => {
    const activeBu = selectedBranch || (selectedBranchId && !selectedBranchId.startsWith("site:") ? selectedBranchId : targetBranch);
    if (!activeBu) return employees;
    return [...employees].sort((a, b) => {
      const aInBu = a.branch_id === activeBu ? 1 : 0;
      const bInBu = b.branch_id === activeBu ? 1 : 0;
      return bInBu - aInBu;
    });
  }, [employees, selectedBranch, selectedBranchId, targetBranch]);

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-in fade-in-50">
      {/* Header */}
      <MovementsHeader
        movements={filteredMovements}
        onOpenRecordModal={() => setShowRecordModal(true)}
      />

      {/* KPI Stats Row */}
      <MovementsStatsRow movements={filteredMovements} />

      {/* Filter Bar */}
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

      {/* Main Table */}
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

      {/* Record Movement Modal */}
      <MovementModal
        open={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        employees={employees}
        branches={branches}
        workLocations={workLocations}
        onSave={handleSaveMovement}
        defaultBranchId={selectedBranch || (selectedBranchId && !selectedBranchId.startsWith("site:") ? selectedBranchId : targetBranch) || ""}
      />

      {/* Movement Details Modal */}
      <MovementDetailModal
        movement={selectedMovement}
        onClose={() => setSelectedMovement(null)}
      />
    </div>
  );
}
