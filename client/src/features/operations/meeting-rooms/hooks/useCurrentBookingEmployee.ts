import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { applyUserEmployeeFilter } from "@/lib/phoneUtils";
import type { BookingEmployee } from "../types";

export function useCurrentBookingEmployee(
  email: string | undefined | null,
  isPartnerBranchBlocked: boolean,
  targetBranch: string
) {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [currentEmployee, setCurrentEmployee] = useState<BookingEmployee | null>(null);

  useEffect(() => {
    if (!email || isPartnerBranchBlocked) {
      setCurrentEmployee(null);
      setEmployeeId("");
      return;
    }

    const empQuery = applyUserEmployeeFilter(
      supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url, email, branch_id"),
      email
    );

    empQuery.limit(5).then(({ data: rows }) => {
      if (!rows || rows.length === 0) {
        setCurrentEmployee(null);
        setEmployeeId("");
        return;
      }
      const data = (targetBranch ? rows.find((r: any) => r.branch_id === targetBranch) : null) || rows[0];
      if (data) {
        setEmployeeId(data.id);
        setCurrentEmployee({
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          department: data.department,
          role: data.role,
          avatar_url: data.avatar_url,
          email: data.email,
          branch_id: data.branch_id,
        });
      }
    });
  }, [email, isPartnerBranchBlocked, targetBranch]);

  return { employeeId, currentEmployee };
}
