import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { LeaveRequest, Employee, LeaveFormData } from "../types";
import { INITIAL_LEAVE_CALENDAR_FORM } from "../constants";
import { calculateDays } from "../dateUtils";

interface UseLeaveCalendarMutationsProps {
  myEmployee: Employee | null;
  loadData: () => Promise<void>;
  setToast: (toast: { type: "success" | "error" | "info"; message: string } | null) => void;
}

export function useLeaveCalendarMutations({
  myEmployee,
  loadData,
  setToast,
}: UseLeaveCalendarMutationsProps) {
  const [inspectLeave, setInspectLeave] = useState<LeaveRequest | null>(null);
  const [dayLeavesModal, setDayLeavesModal] = useState<{ day: number; leaves: LeaveRequest[] } | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const [formData, setFormData] = useState<LeaveFormData>(INITIAL_LEAVE_CALENDAR_FORM);
  const [submitting, setSubmitting] = useState(false);

  const handleQuickRequestSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const empId = formData.employee_id || myEmployee?.id;
      if (!empId) {
        setToast({ type: "error", message: "Please select an employee" });
        return;
      }
      if (!formData.start_date || !formData.end_date) {
        setToast({ type: "error", message: "Please provide start and end dates" });
        return;
      }
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        setToast({ type: "error", message: "End date cannot be earlier than start date" });
        return;
      }

      setSubmitting(true);
      const days = calculateDays(formData.start_date, formData.end_date);
      const { error } = await supabase.from("leave_requests").insert({
        employee_id: empId,
        leave_type: formData.leave_type,
        start_date: formData.start_date,
        end_date: formData.end_date,
        days,
        reason: formData.reason,
        status: "pending",
      });
      setSubmitting(false);

      if (error) {
        setToast({ type: "error", message: "Failed to submit request: " + error.message });
      } else {
        setToast({ type: "success", message: "Leave request submitted successfully" });
        setShowRequestModal(false);
        setFormData(INITIAL_LEAVE_CALENDAR_FORM);
        loadData();
      }
    },
    [formData, myEmployee, loadData, setToast]
  );

  return {
    inspectLeave,
    setInspectLeave,
    dayLeavesModal,
    setDayLeavesModal,
    showRequestModal,
    setShowRequestModal,
    formData,
    setFormData,
    submitting,
    handleQuickRequestSubmit,
  };
}
