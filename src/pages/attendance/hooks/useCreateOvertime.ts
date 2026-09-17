import { useState, useMemo, useCallback } from "react";
import { toast } from "@/components/Toast";
import type { Employee } from "../types";
import { OVERTIME_TYPES, type NewOvertimeForm } from "../types/overtimeTypes";
import { calcOvertimeHours, createOvertimeRecord } from "../services/overtimeService";
import { todayYMD } from "@/lib/date";

interface UseCreateOvertimeProps {
  employees: Employee[];
  initialEmployeeId?: string;
  isEmployeeFixed?: boolean;
  onSaved?: () => Promise<void> | void;
  onBack: () => void;
  activeBranchId?: string | null;
}

export function useCreateOvertime({
  employees,
  initialEmployeeId,
  onSaved,
  onBack,
  activeBranchId,
}: UseCreateOvertimeProps) {
  const today = todayYMD();

  const [employeeId, setEmployeeId] = useState<string>(initialEmployeeId || employees[0]?.id || "");
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);

  const [overtimeType, setOvertimeType] = useState<string>(OVERTIME_TYPES[0]);
  const [fromDate, setFromDate] = useState<string>(today);
  const [toDate, setToDate] = useState<string>(today);

  // Time in & Time out (12-hour split format: HH, MM, AM/PM)
  const [inHour, setInHour] = useState("05");
  const [inMinute, setInMinute] = useState("00");
  const [inPeriod, setInPeriod] = useState<"AM" | "PM">("PM");

  const [outHour, setOutHour] = useState("06");
  const [outMinute, setOutMinute] = useState("00");
  const [outPeriod, setOutPeriod] = useState<"AM" | "PM">("PM");

  const [breakMinutes, setBreakMinutes] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [remark, setRemark] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Helper converting 12h to 24h
  const to24h = (h: string, m: string, p: "AM" | "PM") => {
    let numH = parseInt(h, 10) || 12;
    if (p === "PM" && numH < 12) numH += 12;
    if (p === "AM" && numH === 12) numH = 0;
    return `${String(numH).padStart(2, "0")}:${m.padStart(2, "0")}:00`;
  };

  const timeIn24 = useMemo(() => to24h(inHour, inMinute, inPeriod), [inHour, inMinute, inPeriod]);
  const timeOut24 = useMemo(() => to24h(outHour, outMinute, outPeriod), [outHour, outMinute, outPeriod]);

  // Calculated duration
  const calculatedHours = useMemo(() => {
    return calcOvertimeHours(fromDate, toDate, timeIn24, timeOut24, breakMinutes);
  }, [fromDate, toDate, timeIn24, timeOut24, breakMinutes]);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.id === employeeId) || null;
  }, [employees, employeeId]);

  const filteredEmployees = useMemo(() => {
    if (!employeeSearchQuery.trim()) return employees;
    const q = employeeSearchQuery.toLowerCase();
    return employees.filter((e) => {
      const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
      const role = (e.role || "").toLowerCase();
      const dept = (e.department || "").toLowerCase();
      return name.includes(q) || role.includes(q) || dept.includes(q);
    });
  }, [employees, employeeSearchQuery]);

  const handleSave = useCallback(async () => {
    if (!employeeId) {
      toast("Error", "Please select an employee", "error");
      return;
    }
    if (!reason.trim()) {
      toast("Error", "Please provide a reason for the overtime", "error");
      return;
    }
    if (calculatedHours <= 0) {
      toast("Error", "Overtime period must be greater than 0 hours", "error");
      return;
    }

    setSaving(true);
    try {
      const form: NewOvertimeForm = {
        employee_id: employeeId,
        overtime_type: overtimeType,
        from_date: fromDate,
        to_date: toDate,
        time_in: timeIn24,
        time_out: timeOut24,
        break_minutes: breakMinutes,
        reason,
        remark,
      };

      const res = await createOvertimeRecord({
        form,
        branchId: selectedEmployee?.branch_id || activeBranchId || null,
        file: attachmentFile,
      });

      if (!res.ok) {
        toast("Error", res.error || "Failed to save overtime", "error");
        return;
      }

      toast("Success", `Logged ${calculatedHours}h overtime for ${selectedEmployee?.first_name || "Employee"}`, "success");
      await onSaved?.();
      onBack();
    } catch (err: any) {
      toast("Error", err.message || "Failed to save overtime", "error");
    } finally {
      setSaving(false);
    }
  }, [
    employeeId, reason, calculatedHours, overtimeType, fromDate, toDate, timeIn24, timeOut24,
    breakMinutes, remark, selectedEmployee, activeBranchId, attachmentFile, onSaved, onBack
  ]);

  return {
    employeeId, setEmployeeId, employeeSearchQuery, setEmployeeSearchQuery,
    isEmployeeDropdownOpen, setIsEmployeeDropdownOpen, selectedEmployee, filteredEmployees,
    overtimeType, setOvertimeType, fromDate, setFromDate, toDate, setToDate,
    inHour, setInHour, inMinute, setInMinute, inPeriod, setInPeriod,
    outHour, setOutHour, outMinute, setOutMinute, outPeriod, setOutPeriod,
    breakMinutes, setBreakMinutes, calculatedHours, reason, setReason,
    remark, setRemark, attachmentFile, setAttachmentFile, saving, handleSave,
  };
}
