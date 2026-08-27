import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { formatDate } from "../utils";
import { SHIFT_TEMPLATES } from "../constants";
import type { Shift, ShiftForm, ViewMode } from "../types";

interface UseShiftActionsParams {
  actorName: string;
  shifts: Shift[];
  weekShifts: Shift[];
  filteredShifts: Shift[];
  assignments: any[];
  branches: any[];
  departments: string[];
  currentDate: Date;
  viewMode: ViewMode;
  selectedShift: Shift | null;
  selectedShiftIds: string[];
  shiftForm: ShiftForm;
  duplicateDate: string;
  assignEmployeeIds: string[];
  copyIncludeStaff: boolean;
  submitting: boolean;
  // Setters
  setShiftForm: (fn: any) => void;
  setShowCreateModal: (v: boolean) => void;
  setShowEditModal: (v: boolean) => void;
  setShowDuplicateModal: (v: boolean) => void;
  setShowDeleteConfirm: (v: boolean) => void;
  setShowAssignModal: (v: boolean) => void;
  setShowCopyWeekModal: (v: boolean) => void;
  setSelectedShift: (s: Shift | null) => void;
  setSelectedShiftIds: (ids: string[]) => void;
  setDuplicateDate: (d: string) => void;
  setAssignEmployeeIds: (ids: string[]) => void;
  setSubmitting: (v: boolean) => void;
  setCurrentDate: (d: Date) => void;
  setViewMode: (v: ViewMode) => void;
  loadData: () => Promise<void>;
}

export function useShiftActions(p: UseShiftActionsParams) {
  const navigatePrev = useCallback(() => {
    const d = new Date(p.currentDate);
    if (p.viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (p.viewMode === "day") d.setDate(d.getDate() - 1);
    else d.setDate(d.getDate() - 7);
    p.setCurrentDate(d);
  }, [p.currentDate, p.viewMode, p.setCurrentDate]);

  const navigateNext = useCallback(() => {
    const d = new Date(p.currentDate);
    if (p.viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (p.viewMode === "day") d.setDate(d.getDate() + 1);
    else d.setDate(d.getDate() + 7);
    p.setCurrentDate(d);
  }, [p.currentDate, p.viewMode, p.setCurrentDate]);

  const navigateToday = useCallback(() => {
    p.setCurrentDate(new Date());
  }, [p.setCurrentDate]);

  const openCreateModal = useCallback((presetDate?: string) => {
    p.setShiftForm({
      name: "Morning Shift",
      branch_id: p.branches[0]?.id || "",
      department: p.departments[0] || "Operations",
      start_time: "09:00",
      end_time: "17:00",
      shift_date: presetDate || formatDate(p.currentDate),
      capacity: 5,
      color: "#253C7D",
      notes: "",
    });
    p.setShowCreateModal(true);
  }, [p.branches, p.departments, p.currentDate, p.setShiftForm, p.setShowCreateModal]);

  const applyTemplate = useCallback(
    (tpl: (typeof SHIFT_TEMPLATES)[0]) => {
      p.setShiftForm((prev: ShiftForm) => ({
        ...prev,
        name: tpl.name,
        start_time: tpl.start,
        end_time: tpl.end,
        color: tpl.color,
        capacity: tpl.capacity,
      }));
      toast("Preset Applied", `Loaded "${tpl.name}" template`, "info");
    },
    [p.setShiftForm]
  );

  const handleCreateShift = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!p.shiftForm.name.trim() || !p.shiftForm.shift_date) {
        toast("Validation", "Please fill in all required shift fields", "error");
        return;
      }
      p.setSubmitting(true);
      const { data, error } = await supabase
        .from("shifts")
        .insert({
          name: p.shiftForm.name.trim(),
          branch_id: p.shiftForm.branch_id || null,
          department: p.shiftForm.department.trim() || null,
          start_time: p.shiftForm.start_time,
          end_time: p.shiftForm.end_time,
          shift_date: p.shiftForm.shift_date,
          capacity: Number(p.shiftForm.capacity) || 1,
          color: p.shiftForm.color || "#253C7D",
          notes: p.shiftForm.notes.trim() || null,
        })
        .select()
        .single();

      p.setSubmitting(false);
      if (error) {
        toast("Error", "Failed to create shift: " + error.message, "error");
        return;
      }
      toast("Success", `Shift "${p.shiftForm.name}" created!`, "success");
      p.setShowCreateModal(false);
      await p.loadData();
      if (data) p.setSelectedShift({ ...data, assignmentCount: 0 });
    },
    [p.shiftForm, p.setSubmitting, p.setShowCreateModal, p.loadData, p.setSelectedShift]
  );

  const openEditModal = useCallback(
    (shift: Shift) => {
      p.setShiftForm({
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
      p.setShowEditModal(true);
    },
    [p.setShiftForm, p.setShowEditModal]
  );

  const handleEditShift = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!p.selectedShift) return;
      p.setSubmitting(true);
      const { error } = await supabase
        .from("shifts")
        .update({
          name: p.shiftForm.name.trim(),
          branch_id: p.shiftForm.branch_id || null,
          department: p.shiftForm.department.trim() || null,
          start_time: p.shiftForm.start_time,
          end_time: p.shiftForm.end_time,
          shift_date: p.shiftForm.shift_date,
          capacity: Number(p.shiftForm.capacity) || 1,
          color: p.shiftForm.color || "#253C7D",
          notes: p.shiftForm.notes.trim() || null,
        })
        .eq("id", p.selectedShift.id);

      p.setSubmitting(false);
      if (error) {
        toast("Error", "Failed to update shift: " + error.message, "error");
        return;
      }
      toast("Success", "Shift updated", "success");
      p.setShowEditModal(false);
      p.loadData();
    },
    [p.selectedShift, p.shiftForm, p.setSubmitting, p.setShowEditModal, p.loadData]
  );

  const openDuplicateModal = useCallback(
    (shift: Shift) => {
      const nextDay = new Date(shift.shift_date);
      nextDay.setDate(nextDay.getDate() + 1);
      p.setDuplicateDate(formatDate(nextDay));
      p.setShowDuplicateModal(true);
    },
    [p.setDuplicateDate, p.setShowDuplicateModal]
  );

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
      p.loadData();
    },
    [p.loadData]
  );

  const handleDuplicateShift = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!p.selectedShift) return;
      p.setSubmitting(true);
      const { error } = await supabase.from("shifts").insert({
        name: `${p.selectedShift.name}`,
        branch_id: p.selectedShift.branch_id || null,
        department: p.selectedShift.department || null,
        start_time: p.selectedShift.start_time,
        end_time: p.selectedShift.end_time,
        shift_date: p.duplicateDate,
        capacity: p.selectedShift.capacity,
        color: p.selectedShift.color,
        notes: p.selectedShift.notes,
      });
      p.setSubmitting(false);
      if (error) {
        toast("Error", "Failed to duplicate shift: " + error.message, "error");
        return;
      }
      toast("Success", `Shift cloned to ${p.duplicateDate}`, "success");
      p.setShowDuplicateModal(false);
      p.loadData();
    },
    [p.selectedShift, p.duplicateDate, p.setSubmitting, p.setShowDuplicateModal, p.loadData]
  );

  const handleCopyWeekSchedule = useCallback(async () => {
    if (p.weekShifts.length === 0) {
      toast("Notice", "No shifts scheduled in the current week to copy", "info");
      return;
    }
    p.setSubmitting(true);
    try {
      const newShiftsPayload = p.weekShifts.map((sh) => {
        const d = new Date(sh.shift_date);
        d.setDate(d.getDate() + 7);
        return {
          name: sh.name,
          branch_id: sh.branch_id || null,
          department: sh.department || null,
          start_time: sh.start_time,
          end_time: sh.end_time,
          shift_date: formatDate(d),
          capacity: sh.capacity,
          color: sh.color,
          notes: sh.notes,
        };
      });

      const { data: createdShifts, error: createError } = await supabase
        .from("shifts")
        .insert(newShiftsPayload)
        .select();

      if (createError) throw createError;

      if (p.copyIncludeStaff && createdShifts) {
        const assignmentPayload: { shift_id: string; employee_id: string; status: string }[] = [];
        p.weekShifts.forEach((origShift, idx) => {
          const newShift = createdShifts[idx];
          if (!newShift) return;
          p.assignments
            .filter((a) => a.shift_id === origShift.id)
            .forEach((a) => {
              assignmentPayload.push({
                shift_id: newShift.id,
                employee_id: a.employee_id,
                status: "scheduled",
              });
            });
        });
        if (assignmentPayload.length > 0) {
          await supabase.from("shift_assignments").insert(assignmentPayload);
        }
      }

      toast("Success", `Copied ${p.weekShifts.length} shift(s) to next week!`, "success");
      p.setShowCopyWeekModal(false);
      navigateNext();
      await p.loadData();
    } catch (err: any) {
      console.error(err);
      toast("Error", "Failed to copy week schedule: " + err.message, "error");
    } finally {
      p.setSubmitting(false);
    }
  }, [p.weekShifts, p.copyIncludeStaff, p.assignments, p.setSubmitting, p.setShowCopyWeekModal, p.loadData]);

  const handleBulkDelete = useCallback(async () => {
    if (p.selectedShiftIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${p.selectedShiftIds.length} selected shift(s)?`)) return;
    p.setSubmitting(true);
    const { error } = await supabase
      .from("shifts")
      .update({ deleted_at: new Date().toISOString(), deleted_by: p.actorName })
      .in("id", p.selectedShiftIds);
    p.setSubmitting(false);
    if (error) {
      toast("Error", "Failed to delete shifts: " + error.message, "error");
      return;
    }
    toast("Success", `Deleted ${p.selectedShiftIds.length} shift(s) (moved to Recycle Bin)`, "success");
    p.setSelectedShiftIds([]);
    p.setSelectedShift(null);
    p.loadData();
  }, [p.selectedShiftIds, p.actorName, p.setSubmitting, p.setSelectedShiftIds, p.setSelectedShift, p.loadData]);

  const handleDeleteShift = useCallback(async () => {
    if (!p.selectedShift) return;
    p.setSubmitting(true);
    const { error } = await supabase
      .from("shifts")
      .update({ deleted_at: new Date().toISOString(), deleted_by: p.actorName })
      .eq("id", p.selectedShift.id);
    p.setSubmitting(false);
    if (error) {
      toast("Error", "Failed to delete shift: " + error.message, "error");
      return;
    }
    toast("Success", "Shift deleted (moved to Recycle Bin)", "success");
    p.setSelectedShift(null);
    p.setShowDeleteConfirm(false);
    p.loadData();
  }, [p.selectedShift, p.actorName, p.setSubmitting, p.setSelectedShift, p.setShowDeleteConfirm, p.loadData]);

  const handleAssign = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!p.selectedShift || p.assignEmployeeIds.length === 0) return;
      p.setSubmitting(true);

      const { count } = await supabase
        .from("shift_assignments")
        .select("id", { count: "exact", head: true })
        .eq("shift_id", p.selectedShift.id)
        .is("deleted_at", null);

      const currentCount = count ?? 0;
      const availableSpots = p.selectedShift.capacity - currentCount;
      if (availableSpots <= 0) {
        p.setSubmitting(false);
        toast("Error", "This shift is already full. No additional employees can be assigned.", "error");
        p.loadData();
        return;
      }

      const idsToAssign = p.assignEmployeeIds.slice(0, availableSpots);
      if (idsToAssign.length < p.assignEmployeeIds.length) {
        toast("Warning", `Only ${availableSpots} spot(s) were remaining. Assigned ${idsToAssign.length} employee(s).`, "info");
      }

      const payload = idsToAssign.map((empId) => ({
        shift_id: p.selectedShift!.id,
        employee_id: empId,
        status: "scheduled",
      }));

      const { error } = await supabase.from("shift_assignments").insert(payload);
      p.setSubmitting(false);
      if (error) {
        toast("Error", "Failed to assign employees: " + error.message, "error");
        return;
      }
      toast("Success", `${idsToAssign.length} staff member${idsToAssign.length === 1 ? "" : "s"} scheduled!`, "success");
      p.setAssignEmployeeIds([]);
      p.setShowAssignModal(false);
      p.loadData();
    },
    [p.selectedShift, p.assignEmployeeIds, p.setSubmitting, p.loadData, p.setAssignEmployeeIds, p.setShowAssignModal]
  );

  const removeAssignment = useCallback(
    async (assignId: string) => {
      const { error } = await supabase
        .from("shift_assignments")
        .update({ deleted_at: new Date().toISOString(), deleted_by: p.actorName })
        .eq("id", assignId);
      if (error) {
        toast("Error", "Failed to remove assignment: " + error.message, "error");
        return;
      }
      toast("Success", "Staff removed from shift (moved to Recycle Bin)", "success");
      p.loadData();
    },
    [p.actorName, p.loadData]
  );

  const handleExportCSV = useCallback(() => {
    if (p.filteredShifts.length === 0) {
      toast("Warning", "No shifts to export in current filter", "info");
      return;
    }
    const headers = ["Shift Date", "Shift Name", "Start Time", "End Time", "Duration (Hours)", "Department", "Branch", "Capacity", "Assigned Count", "Assigned Employees", "Notes"];
    const rows = p.filteredShifts.map((s) => {
      const shiftStaff = p.assignments
        .filter((a) => a.shift_id === s.id)
        .map((a) => `${a.employee?.first_name || ""} ${a.employee?.last_name || ""}`.trim())
        .join("; ");
      const { calculateHours: ch } = require("../utils");
      const hours = ch(s.start_time, s.end_time);
      return [
        `"${s.shift_date}"`, `"${s.name.replace(/"/g, '""')}"`,
        `"${s.start_time}"`, `"${s.end_time}"`, hours,
        `"${(s.department || "").replace(/"/g, '""')}"`,
        `"${(s.branches?.name || "").replace(/"/g, '""')}"`,
        s.capacity, s.assignmentCount || 0,
        `"${shiftStaff.replace(/"/g, '""')}"`,
        `"${(s.notes || "").replace(/"/g, '""')}"`,
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shift_schedule_${formatDate(p.currentDate)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Success", "Schedule exported to CSV", "success");
  }, [p.filteredShifts, p.assignments, p.currentDate]);

  return {
    navigatePrev, navigateNext, navigateToday,
    openCreateModal, applyTemplate,
    handleCreateShift, openEditModal, handleEditShift,
    openDuplicateModal, quickDuplicateToNextDay, handleDuplicateShift,
    handleCopyWeekSchedule, handleBulkDelete, handleDeleteShift,
    handleAssign, removeAssignment, handleExportCSV,
  };
}
