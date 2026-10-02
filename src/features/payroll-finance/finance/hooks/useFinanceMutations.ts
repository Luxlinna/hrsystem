import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import type { Expense, ExpenseStatus, ExpenseFormState, BranchFinancePolicy } from "../types";
import { STATUS_CONFIG, INITIAL_EXPENSE_FORM } from "../constants";
import { useFinancePolicyMutations } from "./useFinancePolicyMutations";

interface UseFinanceMutationsProps {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  selectedExpense: Expense | null;
  setSelectedExpense: React.Dispatch<React.SetStateAction<Expense | null>>;
  canManage: boolean;
  actorName: string;
  actorRole: string;
  targetBranch?: string | null;
  loadData: () => Promise<void>;
  setBranchPolicy: React.Dispatch<React.SetStateAction<BranchFinancePolicy | null>>;
}

export function useFinanceMutations({
  expenses,
  setExpenses,
  selectedExpense,
  setSelectedExpense,
  canManage,
  actorName,
  actorRole,
  targetBranch,
  loadData,
  setBranchPolicy,
}: UseFinanceMutationsProps) {
  const [modal, setModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(INITIAL_EXPENSE_FORM);

  const policyMutations = useFinancePolicyMutations({
    actorName,
    actorRole,
    targetBranch,
    loadData,
    setBranchPolicy,
  });

  const updateStatus = useCallback(
    async (id: string, status: ExpenseStatus) => {
      if (!canManage) return;
      const { error } = await supabase.from("expense_records").update({ status }).eq("id", id);
      if (error) {
        toast("Error", "Failed to update status", "error");
        return;
      }
      toast("Status Updated", `Expense marked as ${STATUS_CONFIG[status]?.label || status}`, "success");
      const exp = expenses.find((e) => e.id === id);
      logActivity({
        module: "finance",
        action: status === "approved" ? "approved" : status === "rejected" ? "rejected" : "processed",
        entityType: "expense_record",
        entityId: id,
        actorName,
        actorRole,
        description: `${exp?.category || "Expense"} ($${exp ? Number(exp.amount).toLocaleString() : "?"}) marked ${status}`,
      });
      setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
      if (selectedExpense && selectedExpense.id === id) {
        setSelectedExpense((prev) => (prev ? { ...prev, status } : null));
      }
    },
    [canManage, expenses, actorName, actorRole, selectedExpense, setExpenses, setSelectedExpense]
  );

  const handleCreateExpense = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!expenseForm.category || !expenseForm.amount || !expenseForm.date || !canManage || saving) return;
      setSaving(true);
      const { error } = await supabase.from("expense_records").insert([
        {
          category: expenseForm.category,
          branch_id: targetBranch || expenseForm.branch_id || null,
          amount: Number(expenseForm.amount),
          date: expenseForm.date,
          description: expenseForm.description || null,
          submitted_by: expenseForm.submitted_by || actorName,
          status: "pending",
        },
      ]);
      setSaving(false);
      if (error) {
        toast("Error", "Failed to submit expense", "error");
        return;
      }
      setModal(false);
      setExpenseForm(INITIAL_EXPENSE_FORM);
      toast("Expense Submitted", "New expense entry added into review queue.", "success");
      loadData();
    },
    [expenseForm, canManage, saving, targetBranch, actorName, loadData]
  );

  const openEditModal = useCallback(
    (expense: Expense) => {
      if (!canManage) return;
      setExpenseForm({
        category: expense.category,
        branch_id: expense.branch_id || targetBranch || "",
        amount: String(expense.amount),
        date: expense.date,
        description: expense.description || "",
        submitted_by: expense.submitted_by || "",
      });
      setEditingExpense(expense);
    },
    [canManage, targetBranch]
  );

  const handleSaveEdit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingExpense || !canManage || saving) return;
      setSaving(true);
      const { error } = await supabase
        .from("expense_records")
        .update({
          category: expenseForm.category,
          branch_id: targetBranch || expenseForm.branch_id || null,
          amount: Number(expenseForm.amount),
          date: expenseForm.date,
          description: expenseForm.description || null,
          submitted_by: expenseForm.submitted_by || actorName,
        })
        .eq("id", editingExpense.id);
      setSaving(false);
      if (error) {
        toast("Error", "Failed to update expense", "error");
        return;
      }
      setEditingExpense(null);
      toast("Expense Updated", "Changes saved successfully.", "success");
      loadData();
    },
    [editingExpense, canManage, saving, targetBranch, expenseForm, actorName, loadData]
  );

  const handleDeleteExpense = useCallback(
    async (expenseOrId: Expense | string) => {
      const id = typeof expenseOrId === "string" ? expenseOrId : expenseOrId.id;
      if (!canManage || !confirm("Are you sure you want to delete this expense record?")) return;
      const { error } = await supabase.from("expense_records").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) {
        toast("Error", "Failed to delete expense", "error");
        return;
      }
      toast("Expense Deleted", "Record has been moved to trash.", "success");
      setSelectedExpense(null);
      loadData();
    },
    [canManage, setSelectedExpense, loadData]
  );

  return {
    modal,
    setModal,
    policyModalOpen: policyMutations.policyModalOpen,
    setPolicyModalOpen: policyMutations.setPolicyModalOpen,
    editingExpense,
    setEditingExpense,
    saving,
    savingPolicy: policyMutations.savingPolicy,
    expenseForm,
    setExpenseForm,
    updateStatus,
    handleCreateExpense,
    openEditModal,
    handleSaveEdit,
    handleDeleteExpense,
    handleSavePolicy: policyMutations.handleSavePolicy,
  };
}
