import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { PayrollRecord, PayrollForm, Employee } from "../types";
import { STATUS_CONFIG } from "../constants";

interface UsePayrollMutationsProps {
  employees: Employee[];
  selectedMonth: string;
  loadData: () => Promise<void>;
  setAllRecords: React.Dispatch<React.SetStateAction<PayrollRecord[]>>;
}

export function usePayrollMutations({
  employees,
  selectedMonth,
  loadData,
  setAllRecords,
}: UsePayrollMutationsProps) {
  const [payslipModal, setPayslipModal] = useState<PayrollRecord | null>(null);
  const [recordModal, setRecordModal] = useState<{ open: boolean; record: PayrollRecord | null }>({
    open: false,
    record: null,
  });
  const [savingRecord, setSavingRecord] = useState(false);
  const [recordForm, setRecordForm] = useState<PayrollForm>({
    employee_id: "",
    month: selectedMonth,
    base_salary: 0,
    bonus: 0,
    deductions: 0,
    status: "processed",
    notes: "",
  });

  const handleUpdateStatus = useCallback(
    async (recordId: string, newStatus: "paid" | "processed" | "pending") => {
      const { error } = await supabase
        .from("payroll_records")
        .update({ status: newStatus })
        .eq("id", recordId);

      if (error) {
        toast("Error", "Failed to update status", "error");
        return;
      }

      toast("Status Updated", `Payroll marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`, "success");
      setAllRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, status: newStatus } : r))
      );
    },
    [setAllRecords]
  );

  const openRecordModal = useCallback(
    (rec?: PayrollRecord | null) => {
      if (rec) {
        setRecordModal({ open: true, record: rec });
        setRecordForm({
          employee_id: rec.employee_id,
          month: rec.month,
          base_salary: Number(rec.base_salary || 0),
          bonus: Number(rec.bonus || 0),
          deductions: Number(rec.deductions || 0),
          status: rec.status,
          notes: rec.notes || "",
        });
      } else {
        setRecordModal({ open: true, record: null });
        setRecordForm({
          employee_id: employees[0]?.id || "",
          month: selectedMonth,
          base_salary: 3500,
          bonus: 0,
          deductions: 250,
          status: "processed",
          notes: "",
        });
      }
    },
    [employees, selectedMonth]
  );

  const handleSaveRecord = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!recordForm.employee_id || !recordForm.month || savingRecord) return;
      setSavingRecord(true);

      const calculatedNet =
        Number(recordForm.base_salary || 0) +
        Number(recordForm.bonus || 0) -
        Number(recordForm.deductions || 0);

      if (recordModal.record) {
        // Edit existing
        const { error } = await supabase
          .from("payroll_records")
          .update({
            month: recordForm.month,
            base_salary: recordForm.base_salary,
            bonus: recordForm.bonus,
            deductions: recordForm.deductions,
            net_pay: calculatedNet,
            status: recordForm.status,
            notes: recordForm.notes ? recordForm.notes.trim() : null,
          })
          .eq("id", recordModal.record.id);

        setSavingRecord(false);
        if (error) {
          toast("Error", "Failed to update record", "error");
          return;
        }
        toast("Record Updated", "Payroll entry saved successfully.", "success");
      } else {
        // Create new
        const { error } = await supabase.from("payroll_records").insert({
          employee_id: recordForm.employee_id,
          month: recordForm.month,
          base_salary: recordForm.base_salary,
          bonus: recordForm.bonus,
          deductions: recordForm.deductions,
          net_pay: calculatedNet,
          status: recordForm.status,
          notes: recordForm.notes ? recordForm.notes.trim() : null,
        });

        setSavingRecord(false);
        if (error) {
          toast("Error", "Failed to create payroll record", "error");
          return;
        }
        toast("Record Created", "Payroll entry added successfully.", "success");
      }

      setRecordModal({ open: false, record: null });
      loadData();
    },
    [recordForm, savingRecord, recordModal.record, loadData]
  );

  const handleDeleteRecord = useCallback(
    async (id: string, empName: string) => {
      if (!confirm(`Delete payroll entry for "${empName}"?`)) return;
      const { error } = await supabase.from("payroll_records").delete().eq("id", id);
      if (error) {
        toast("Error", "Failed to delete record", "error");
        return;
      }
      toast("Record Deleted", "Payroll entry removed.", "success");
      setAllRecords((prev) => prev.filter((r) => r.id !== id));
    },
    [setAllRecords]
  );

  return {
    payslipModal,
    setPayslipModal,
    recordModal,
    setRecordModal,
    savingRecord,
    recordForm,
    setRecordForm,
    handleUpdateStatus,
    openRecordModal,
    handleSaveRecord,
    handleDeleteRecord,
  };
}
