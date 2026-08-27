import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { Employee, PayrollRecord } from "../types";

export function usePayrollData(
  currentMonthStr: string,
  setSelectedMonth: (month: string) => void
) {
  const { user } = useAuth();
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const canViewAll = isAdmin || Boolean(role?.payroll_view_all_employees);

  const [allRecords, setAllRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    if (canViewAll) {
      const [{ data: recordsData }, { data: empsData }] = await Promise.all([
        supabase
          .from("payroll_records")
          .select("id, employee_id, month, base_salary, bonus, deductions, net_pay, status, notes, created_at, employees(id, first_name, last_name, role, department, avatar_url, branch_id, branches(id, name))")
          .order("month", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, branch_id, branches(id, name)")
          .eq("status", "active")
          .order("first_name"),
      ]);

      setAllRecords((recordsData as PayrollRecord[]) || []);
      setEmployees((empsData as unknown as Employee[]) || []);

      if (recordsData && recordsData.length > 0) {
        const hasCurrentMonth = recordsData.some((r) => r.month === currentMonthStr);
        if (!hasCurrentMonth) {
          setSelectedMonth(recordsData[0].month);
        }
      }
      setLoading(false);
      return;
    }

    // Individual employee self-service view
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const { data: me } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, avatar_url")
      .eq("email", user.email)
      .maybeSingle();

    if (!me) {
      setAllRecords([]);
      setEmployees([]);
      setLoading(false);
      return;
    }

    setEmployees([me as Employee]);
    const { data: myRecords } = await supabase
      .from("payroll_records")
      .select("id, employee_id, month, base_salary, bonus, deductions, net_pay, status, notes, created_at, employees(id, first_name, last_name, role, department, avatar_url)")
      .eq("employee_id", me.id)
      .order("month", { ascending: false });

    setAllRecords((myRecords as PayrollRecord[]) || []);
    if (myRecords && myRecords.length > 0) {
      const hasCurrent = myRecords.some((r) => r.month === currentMonthStr);
      if (!hasCurrent) {
        setSelectedMonth(myRecords[0].month);
      }
    }
    setLoading(false);
  }, [canViewAll, currentMonthStr, setSelectedMonth, user?.email]);

  useEffect(() => {
    if (permsLoading) return;
    loadData();
  }, [permsLoading, loadData]);

  return {
    canViewAll,
    allRecords,
    setAllRecords,
    employees,
    loading,
    loadData,
  };
}
