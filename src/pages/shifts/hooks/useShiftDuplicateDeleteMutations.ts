import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Shift } from "../types";
import { formatDate } from "../utils";

interface UseShiftDuplicateDeleteMutationsProps {
  actorName: string;
  loadData: () => Promise<void>;
  setSubmitting: (v: boolean) => void;
}

export function useShiftDuplicateDeleteMutations({
  actorName,
  loadData,
  setSubmitting,
}: UseShiftDuplicateDeleteMutationsProps) {
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [duplicateDate, setDuplicateDate] = useState(formatDate(new Date()));

  const openDuplicateModal = useCallback((shift: Shift) => {
    const nextDay = new Date(shift.shift_date);
    nextDay.setDate(nextDay.getDate() + 1);
    setDuplicateDate(formatDate(nextDay));
    setShowDuplicateModal(true);
  }, []);

  const quickDuplicateToNextDay = useCallback(
    async (shift: Shift, e: React.MouseEvent) => {
      e.stopPropagation();
      const nextDay = new Date(shift.shift_date);
      nextDay.setDate(nextDay.getDate() + 1);
      const targetDate = formatDate(nextDay);

      const { error } = await supabase.from("shifts").insert({
        name: shift.name,
        branch_id: shift.branch_id || null,
        department: shift.department || null,
        start_time: shift.start_time,
        end_time: shift.end_time,
        shift_date: targetDate,
        capacity: shift.capacity,
        color: shift.color,
        notes: shift.notes,
      });

      if (error) {
        toast("Error", "Failed to duplicate shift: " + error.message, "error");
        return;
      }
      toast("Success", `Duplicated "${shift.name}" to ${targetDate}`, "success");
      loadData();
    },
    [loadData]
  );

  const handleDuplicateShift = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedShift) return;
      setSubmitting(true);
      const { error } = await supabase.from("shifts").insert({
        name: `${selectedShift.name}`,
        branch_id: selectedShift.branch_id || null,
        department: selectedShift.department || null,
        start_time: selectedShift.start_time,
        end_time: selectedShift.end_time,
        shift_date: duplicateDate,
        capacity: selectedShift.capacity,
        color: selectedShift.color,
        notes: selectedShift.notes,
      });

      setSubmitting(false);
      if (error) {
        toast("Error", "Failed to duplicate shift: " + error.message, "error");
        return;
      }
      toast("Success", `Shift cloned to ${duplicateDate}`, "success");
      setShowDuplicateModal(false);
      loadData();
    },
    [selectedShift, duplicateDate, setSubmitting, loadData]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedShiftIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedShiftIds.length} selected shift(s)?`)) return;

    setSubmitting(true);
    const { error } = await supabase.from("shifts").update({
      deleted_at: new Date().toISOString(),
      deleted_by: actorName,
    }).in("id", selectedShiftIds);
    setSubmitting(false);

    if (error) {
      toast("Error", "Failed to delete shifts: " + error.message, "error");
      return;
    }
    toast("Success", `Deleted ${selectedShiftIds.length} shift(s) (moved to Recycle Bin)`, "success");
    setSelectedShiftIds([]);
    setSelectedShift(null);
    loadData();
  }, [selectedShiftIds, actorName, setSubmitting, loadData]);

  const handleDeleteShift = useCallback(async () => {
    if (!selectedShift) return;
    setSubmitting(true);
    const { error } = await supabase.from("shifts").update({
      deleted_at: new Date().toISOString(),
      deleted_by: actorName,
    }).eq("id", selectedShift.id);
    setSubmitting(false);

    if (error) {
      toast("Error", "Failed to delete shift: " + error.message, "error");
      return;
    }
    toast("Success", "Shift deleted (moved to Recycle Bin)", "success");
    setSelectedShift(null);
    setShowDeleteConfirm(false);
    loadData();
  }, [selectedShift, actorName, setSubmitting, loadData]);

  return {
    selectedShift,
    setSelectedShift,
    selectedShiftIds,
    setSelectedShiftIds,
    showDuplicateModal,
    setShowDuplicateModal,
    showDeleteConfirm,
    setShowDeleteConfirm,
    duplicateDate,
    setDuplicateDate,
    openDuplicateModal,
    quickDuplicateToNextDay,
    handleDuplicateShift,
    handleBulkDelete,
    handleDeleteShift,
  };
}
