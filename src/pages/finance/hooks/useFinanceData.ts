import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Expense, Branch } from "../types";

export function useFinanceData() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: expData }, { data: branchData }] = await Promise.all([
      supabase
        .from("expense_records")
        .select("*, branches(id, name)")
        .is("deleted_at", null)
        .order("date", { ascending: false }),
      supabase.from("branches").select("id, name").order("name"),
    ]);

    setExpenses((expData as unknown as Expense[]) || []);
    setBranches((branchData as Branch[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    expenses,
    setExpenses,
    branches,
    loading,
    loadData,
  };
}
