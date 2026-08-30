import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Shift, ShiftForm, ShiftTemplate } from "../types";
import { formatDate } from "../utils";

interface UseShiftCreateEditMutationsProps {
  isSuperAdmin: boolean;
  userBranchId: string | null;
  effectiveBranchId: string | null;
  defaultBranchId: string;
  defaultDepartment: string;
  currentDate: Date;
  loadData: () => Promise<void>;
  setSubmitting: (v: boolean) => void;
  setSelectedShift: (s: Shift | null) => void;
  selectedShift: Shift | null;
}

export function useShiftCreateEditMutations({
  isSuperAdmin,
  userBranchId,
  effectiveBranchId,
  defaultBranchId,
  defaultDepartment,
  currentDate,
  loadData,
  setSubmitting,
  setSelectedShift,
  selectedShift,
}: UseShiftCreateEditMutationsProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [shiftForm, setShiftForm] = useState<ShiftForm>({
    name: "",
    branch_id: "",
    department: "",
    start_time: "09:00",
    end_time: "17:00",
    shift_date: formatDate(new Date()),
    capacity: 5,
    color: "#253C7D",
    notes: "",
  });

  const applyTemplate = useCallback((tpl: ShiftTemplate) => {
    setShiftForm((prev) => ({
      ...prev,
      name: tpl.name,
      start_time: tpl.start,
      end_time: tpl.end,
      color: tpl.color,
      capacity: tpl.capacity,
    }));
    toast("Preset Applied", `Loaded "${tpl.name}" template`, "info");
  }, []);

  const openCreateModal = useCallback(
    (presetDate?: string) => {
      const targetBranch = !isSuperAdmin && userBranchId ? userBranchId : effectiveBranchId || defaultBranchId;
      setShiftForm({
        name: "Morning Shift",
        branch_id: targetBranch,
        department: defaultDepartment || "Operations",
        start_time: "09:00",
        end_time: "17:00",
        shift_date: presetDate || formatDate(currentDate),
        capacity: 5,
        color: "#253C7D",
        notes: "",
      });
      setShowCreateModal(true);
    },
    [isSuperAdmin, userBranchId, effectiveBranchId, defaultBranchId, defaultDepartment, currentDate]
  );

  const handleCreateShift = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!shiftForm.name.trim() || !shiftForm.shift_date) {
        toast("Validation", "Please fill in all required shift fields", "error");
        return;
      }
      setSubmitting(true);
      const assignedBranch = !isSuperAdmin && userBranchId ? userBranchId : shiftForm.branch_id || effectiveBranchId || null;
      const { data, error } = await supabase
        .from("shifts")
        .insert({
          name: shiftForm.name.trim(),
          branch_id: assignedBranch,
          department: shiftForm.department.trim() || null,
          start_time: shiftForm.start_time,
          end_time: shiftForm.end_time,
          shift_date: shiftForm.shift_date,
          capacity: Number(shiftForm.capacity) || 1,
          color: shiftForm.color || "#253C7D",
          notes: shiftForm.notes.trim() || null,
        })
        .select()
        .single();

      setSubmitting(false);
      if (error) {
        toast("Error", "Failed to create shift: " + error.message, "error");
        return;
      }
      toast("Success", `Shift "${shiftForm.name}" created!`, "success");
      setShowCreateModal(false);
      await loadData();
      if (data) setSelectedShift({ ...data, assignmentCount: 0 });
    },
    [shiftForm, isSuperAdmin, userBranchId, effectiveBranchId, setSubmitting, loadData, setSelectedShift]
  );

  const openEditModal = useCallback((shift: Shift) => {
    setShiftForm({
      name: shift.name,
      branch_id: shift.branch_id || "",
      department: shift.department || "",
      start_time: shift.start_time?.slice(0, 5) || "09:00",
      end_time: shift.end_time?.slice(0, 5) || "17:00",
      shift_date: shift.shift_date,
      capacity: shift.capacity || 1,
      color: shift.color || "#253C7D",
      notes: shift.notes || "",
    });
    setShowEditModal(true);
  }, []);

  const handleEditShift = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedShift) return;
      setSubmitting(true);
      const { error } = await supabase
        .from("shifts")
        .update({
          name: shiftForm.name.trim(),
          branch_id: shiftForm.branch_id || null,
          department: shiftForm.department.trim() || null,
          start_time: shiftForm.start_time,
          end_time: shiftForm.end_time,
          shift_date: shiftForm.shift_date,
          capacity: Number(shiftForm.capacity) || 1,
          color: shiftForm.color || "#253C7D",
          notes: shiftForm.notes.trim() || null,
        })
        .eq("id", selectedShift.id);

      setSubmitting(false);
      if (error) {
        toast("Error", "Failed to update shift: " + error.message, "error");
        return;
      }
      toast("Success", "Shift updated", "success");
      setShowEditModal(false);
      loadData();
    },
    [selectedShift, shiftForm, setSubmitting, loadData]
  );

  return {
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    shiftForm,
    setShiftForm,
    applyTemplate,
    openCreateModal,
    handleCreateShift,
    openEditModal,
    handleEditShift,
  };
}
