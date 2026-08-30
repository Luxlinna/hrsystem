import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Shift } from "../types";
import { formatDate, calculateHours } from "../utils";

interface UseShiftScheduleActionsProps {
  currentDate: Date;
  weekShifts: Shift[];
  filteredShifts: Shift[];
  assignments: any[];
  loadData: () => Promise<void>;
  navigateNext: () => void;
  setSubmitting: (v: boolean) => void;
}

export function useShiftScheduleActions({
  currentDate,
  weekShifts,
  filteredShifts,
  assignments,
  loadData,
  navigateNext,
  setSubmitting,
}: UseShiftScheduleActionsProps) {
  const [showCopyWeekModal, setShowCopyWeekModal] = useState(false);
  const [showWorkloadDrawer, setShowWorkloadDrawer] = useState(false);
  const [copyIncludeStaff, setCopyIncludeStaff] = useState(true);

  const handleCopyWeekSchedule = useCallback(async () => {
    if (weekShifts.length === 0) {
      toast("Notice", "No shifts scheduled in the current week to copy", "info");
      return;
    }
    setSubmitting(true);
    try {
      const newShiftsPayload = weekShifts.map((sh) => {
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

      const { data: createdShifts, error: createError } = await supabase.from("shifts").insert(newShiftsPayload).select();
      if (createError) throw createError;

      if (copyIncludeStaff && createdShifts) {
        const assignmentPayload: { shift_id: string; employee_id: string; status: string }[] = [];
        weekShifts.forEach((origShift, idx) => {
          const newShift = createdShifts[idx];
          if (!newShift) return;
          const origAssignments = assignments.filter((a) => a.shift_id === origShift.id);
          origAssignments.forEach((a) => {
            assignmentPayload.push({ shift_id: newShift.id, employee_id: a.employee_id, status: "scheduled" });
          });
        });
        if (assignmentPayload.length > 0) {
          await supabase.from("shift_assignments").insert(assignmentPayload);
        }
      }

      toast("Success", `Copied ${weekShifts.length} shift(s) to next week!`, "success");
      setShowCopyWeekModal(false);
      navigateNext();
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast("Error", "Failed to copy week schedule: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  }, [weekShifts, copyIncludeStaff, assignments, navigateNext, setSubmitting, loadData]);

  const handleExportCSV = useCallback(() => {
    if (filteredShifts.length === 0) {
      toast("Warning", "No shifts to export in current filter", "info");
      return;
    }

    const headers = ["Shift Date", "Shift Name", "Start Time", "End Time", "Duration (Hours)", "Department", "Branch", "Capacity", "Assigned Count", "Assigned Employees", "Notes"];
    const rows = filteredShifts.map((s) => {
      const shiftStaff = assignments
        .filter((a) => a.shift_id === s.id)
        .map((a) => `${a.employee?.first_name || ""} ${a.employee?.last_name || ""}`.trim())
        .join("; ");
      const hours = calculateHours(s.start_time, s.end_time);

      return [
        `"${s.shift_date}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.start_time}"`,
        `"${s.end_time}"`,
        hours,
        `"${(s.department || "").replace(/"/g, '""')}"`,
        `"${(s.branches?.name || "").replace(/"/g, '""')}"`,
        s.capacity,
        s.assignmentCount || 0,
        `"${shiftStaff.replace(/"/g, '""')}"`,
        `"${(s.notes || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shift_schedule_${formatDate(currentDate)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Success", "Schedule exported to CSV", "success");
  }, [filteredShifts, assignments, currentDate]);

  return {
    showCopyWeekModal,
    setShowCopyWeekModal,
    showWorkloadDrawer,
    setShowWorkloadDrawer,
    copyIncludeStaff,
    setCopyIncludeStaff,
    handleCopyWeekSchedule,
    handleExportCSV,
  };
}
