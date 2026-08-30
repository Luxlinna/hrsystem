import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Shift } from "../types";

interface UseShiftAssignmentMutationsProps {
  actorName: string;
  selectedShift: Shift | null;
  loadData: () => Promise<void>;
  setSubmitting: (v: boolean) => void;
}

export function useShiftAssignmentMutations({
  actorName,
  selectedShift,
  loadData,
  setSubmitting,
}: UseShiftAssignmentMutationsProps) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignDeptFilter, setAssignDeptFilter] = useState("all");

  const handleAssign = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedShift || assignEmployeeIds.length === 0) return;
      setSubmitting(true);

      const { count } = await supabase
        .from("shift_assignments")
        .select("id", { count: "exact", head: true })
        .eq("shift_id", selectedShift.id)
        .is("deleted_at", null);

      const currentCount = count ?? 0;
      const availableSpots = selectedShift.capacity - currentCount;

      if (availableSpots <= 0) {
        setSubmitting(false);
        toast("Error", "This shift is already full. No additional employees can be assigned.", "error");
        loadData();
        return;
      }

      const idsToAssign = assignEmployeeIds.slice(0, availableSpots);
      if (idsToAssign.length < assignEmployeeIds.length) {
        toast("Warning", `Only ${availableSpots} spot(s) were remaining. Assigned ${idsToAssign.length} employee(s).`, "info");
      }

      const payload = idsToAssign.map((empId) => ({
        shift_id: selectedShift.id,
        employee_id: empId,
        status: "scheduled",
      }));

      const { error } = await supabase.from("shift_assignments").insert(payload);
      setSubmitting(false);

      if (error) {
        toast("Error", "Failed to assign employees: " + error.message, "error");
        return;
      }
      toast("Success", `${idsToAssign.length} staff member${idsToAssign.length === 1 ? "" : "s"} scheduled!`, "success");
      setAssignEmployeeIds([]);
      setShowAssignModal(false);
      loadData();
    },
    [selectedShift, assignEmployeeIds, setSubmitting, loadData]
  );

  const removeAssignment = useCallback(
    async (assignId: string) => {
      const { error } = await supabase
        .from("shift_assignments")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", assignId);

      if (error) {
        toast("Error", "Failed to remove assignment: " + error.message, "error");
        return;
      }
      toast("Success", "Staff removed from shift (moved to Recycle Bin)", "success");
      loadData();
    },
    [actorName, loadData]
  );

  return {
    showAssignModal,
    setShowAssignModal,
    assignEmployeeIds,
    setAssignEmployeeIds,
    assignSearch,
    setAssignSearch,
    assignDeptFilter,
    setAssignDeptFilter,
    handleAssign,
    removeAssignment,
  };
}
