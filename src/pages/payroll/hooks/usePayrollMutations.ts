import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { PayrollRecord, PayrollForm, Employee, BranchPayrollPolicy } from "../types";
import { STATUS_CONFIG } from "../constants";
import { useBranchPolicyMutations } from "./useBranchPolicyMutations";

interface UsePayrollMutationsProps {
  employees: Employee[];
  selectedMonth: string;
  targetBranch: string | null;
  actorName: string;
  loadData: () => Promise<void>;
  setAllRecords: React.Dispatch<React.SetStateAction<PayrollRecord[]>>;
  setBranchPolicy: React.Dispatch<React.SetStateAction<BranchPayrollPolicy | null>>;
}

export function usePayrollMutations({
  employees,
  selectedMonth,
  targetBranch,
  actorName,
  loadData,
  setAllRecords,
  setBranchPolicy,
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
  });

  const policyMutations = useBranchPolicyMutations({ targetBranch, actorName, loadData, setBranchPolicy });

  const handleUpdateStatus = useCallback(
    async (recordId: string, newStatus: "paid" | "processed" | "pending") => {
      const { error } = await supabase.from("payroll_records").update({ status: newStatus }).eq("id", recordId);
      if (error) {
        toast("Error", "Failed to update status: " + error.message, "error");
        return;
      }
      toast("Status Updated", `Payroll marked as ${STATUS_CONFIG[newStatus]?.label || newStatus}`, "success");
      setAllRecords((prev) => prev.map((r) => (r.id === recordId ? { ...r, status: newStatus } : r)));
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

      const base = Number(recordForm.base_salary || 0);
      const bonus = Number(recordForm.bonus || 0);
      const deductions = Number(recordForm.deductions || 0);
      const gross = base + bonus;
      const net = gross - deductions;

      const empObj = employees.find((e) => e.id === recordForm.employee_id);
      const branchId = targetBranch || empObj?.branch_id || null;

      if (recordModal.record) {
        const updatePayload: Record<string, any> = {
          month: recordForm.month,
          base_salary: base,
          bonus: bonus,
          deductions: deductions,
          gross_pay: gross,
          net_pay: net,
          status: recordForm.status || "processed",
        };
        if (branchId) updatePayload.branch_id = branchId;

        const { error } = await supabase.from("payroll_records").update(updatePayload).eq("id", recordModal.record.id);
        setSavingRecord(false);
        if (error) {
          toast("Error", "Failed to update record: " + error.message, "error");
          return;
        }
        toast("Record Updated", "Payroll entry saved successfully.", "success");
      } else {
        const insertPayload: Record<string, any> = {
          employee_id: recordForm.employee_id,
          month: recordForm.month,
          base_salary: base,
          bonus: bonus,
          deductions: deductions,
          gross_pay: gross,
          net_pay: net,
          status: recordForm.status || "processed",
        };
        if (branchId) insertPayload.branch_id = branchId;

        const { error } = await supabase.from("payroll_records").insert([insertPayload]);
        setSavingRecord(false);
        if (error) {
          toast("Error", "Failed to create payroll record: " + error.message, "error");
          return;
        }
        toast("Record Created", "Payroll entry added successfully.", "success");
      }

      setRecordModal({ open: false, record: null });
      loadData();
    },
    [recordForm, savingRecord, recordModal.record, employees, targetBranch, loadData]
  );

  const handleDeleteRecord = useCallback(
    async (id: string, empName: string) => {
      if (!confirm(`Delete payroll entry for "${empName}"?`)) return;
      const { error } = await supabase.from("payroll_records").delete().eq("id", id);
      if (error) {
        toast("Error", "Failed to delete record: " + error.message, "error");
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
    policyModalOpen: policyMutations.policyModalOpen,
    setPolicyModalOpen: policyMutations.setPolicyModalOpen,
    savingRecord,
    savingPolicy: policyMutations.savingPolicy,
    recordForm,
    setRecordForm,
    handleUpdateStatus,
    openRecordModal,
    handleSaveRecord,
    handleDeleteRecord,
    handleSavePolicy: policyMutations.handleSavePolicy,
  };
}
