import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import type { Expense, ExpenseStatus, ExpenseFormState, BranchFinancePolicy } from "../types";
import { STATUS_CONFIG, INITIAL_EXPENSE_FORM } from "../constants";

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
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [expenseForm, setExpenseForm] = useState<ExpenseFormState>(INITIAL_EXPENSE_FORM);

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
      const logAction = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "processed";
      logActivity({
        module: "finance",
        action: logAction,
        entityType: "expense_record",
        entityId: id,
        actorName,
        actorRole,
        description: `${exp?.category || "Expense"} ($${exp ? Number(exp.amount).toLocaleString() : "?"}) marked ${status}`,
      });

      notify({
        source: "finance",
        type: status === "approved" ? "success" : status === "rejected" ? "warning" : "info",
        title: `Expense ${status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Updated"}`,
        message: `${exp?.category || "Expense"} ($${exp ? Number(exp.amount).toLocaleString() : "?"}) has been marked as ${
          STATUS_CONFIG[status]?.label || status
        }.`,
        entityId: id,
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

      const resolvedBranchId = targetBranch || expenseForm.branch_id || null;

      const { error } = await supabase.from("expense_records").insert([
        {
          category: expenseForm.category,
          branch_id: resolvedBranchId,
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
      logActivity({
        module: "finance",
        action: "created",
        entityType: "expense_record",
        actorName,
        actorRole,
        description: `New ${expenseForm.category} expense submitted ($${Number(expenseForm.amount).toLocaleString()})`,
      });
      notify({
        source: "finance",
        type: "warning",
        title: "New Expense Pending Review",
        message: `${expenseForm.submitted_by || actorName} submitted a ${expenseForm.category} expense of $${Number(
          expenseForm.amount
        ).toLocaleString()} for approval.`,
      });
      loadData();
    },
    [expenseForm, canManage, saving, targetBranch, actorName, actorRole, loadData]
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

      const resolvedBranchId = targetBranch || expenseForm.branch_id || null;

      const { error } = await supabase
        .from("expense_records")
        .update({
          category: expenseForm.category,
          branch_id: resolvedBranchId,
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
      setExpenseForm(INITIAL_EXPENSE_FORM);
      toast("Expense Updated", "Expense changes have been saved.", "success");
      logActivity({
        module: "finance",
        action: "updated",
        entityType: "expense_record",
        entityId: editingExpense.id,
        actorName,
        actorRole,
        description: `Updated expense #${editingExpense.id.slice(0, 8)} (${expenseForm.category})`,
      });
      loadData();
    },
    [editingExpense, expenseForm, canManage, saving, targetBranch, actorName, actorRole, loadData]
  );

  const handleDeleteExpense = useCallback(
    async (target: Expense | string, optCategory?: string) => {
      if (!canManage) return;
      const id = typeof target === "string" ? target : target.id;
      const category = typeof target === "string" ? optCategory || "Expense" : target.category;

      if (!confirm(`Move "${category}" expense to the Recycle Bin? It can be restored later.`)) return;

      const { error } = await supabase
        .from("expense_records")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", id);

      if (error) {
        toast("Error", "Failed to delete expense", "error");
        return;
      }

      setExpenses((prev) => prev.filter((e) => e.id !== id));
      if (selectedExpense?.id === id) setSelectedExpense(null);
      toast("Moved to Recycle Bin", "The expense can be restored from the Recycle Bin.", "success");
      logActivity({
        module: "finance",
        action: "deleted",
        entityType: "expense_record",
        entityId: id,
        actorName,
        actorRole,
        description: `Moved ${category} expense to Recycle Bin`,
      });
      loadData();
    },
    [canManage, actorName, actorRole, selectedExpense, setExpenses, setSelectedExpense, loadData]
  );

  const handleSavePolicy = useCallback(
    async (policyUpdates: Partial<BranchFinancePolicy>) => {
      if (!targetBranch) {
        toast("Error", "Please select a branch to configure its finance policy.", "error");
        return;
      }

      setSavingPolicy(true);
      const payload = {
        branch_id: targetBranch,
        ...policyUpdates,
        updated_by: actorName,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("branch_finance_policies")
        .upsert(payload, { onConflict: "branch_id" });

      setSavingPolicy(false);

      if (error) {
        toast("Error", "Failed to save finance policy: " + error.message, "error");
        return;
      }

      toast("Policy Saved", "Branch finance & budget policy updated successfully.", "success");
      setBranchPolicy((prev) => (prev ? { ...prev, ...payload } : (payload as BranchFinancePolicy)));
      setPolicyModalOpen(false);
      loadData();
    },
    [targetBranch, actorName, setBranchPolicy, loadData]
  );

  return {
    modal,
    setModal,
    policyModalOpen,
    setPolicyModalOpen,
    editingExpense,
    setEditingExpense,
    saving,
    savingPolicy,
    expenseForm,
    setExpenseForm,
    updateStatus,
    handleCreateExpense,
    openEditModal,
    handleSaveEdit,
    handleDeleteExpense,
    handleSavePolicy,
  };
}
