import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee, LeaveTypePolicy } from "@/features/time-attendance/leave/types";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

interface UseLeaveMetadataParams {
  employeeId: string;
  initialEmployee?: Employee | null;
}

export function useSelfServiceLeaveMetadata({
  employeeId,
  initialEmployee,
}: UseLeaveMetadataParams) {
  const [entitlement, setEntitlement] = useState(18);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(
    initialEmployee || null
  );
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [myApproverName, setMyApproverName] = useState<string>("");
  const [hrApprovers, setHrApprovers] = useState<Employee[]>([]);
  const [leaveTypePolicies, setLeaveTypePolicies] = useState<LeaveTypePolicy[]>([]);

  useEffect(() => {
    if (!employeeId) return;
    let isMounted = true;

    async function load() {
      try {
        const { data: empData } = await supabase
          .from("employees")
          .select("id, first_name, last_name, display_name, full_name, role, department, annual_leave_days, avatar_url, branch_id, email, reports_to, employee_code, biometric_user_id, phone")
          .eq("id", employeeId)
          .maybeSingle();

        if (!isMounted) return;
        const activeEmp = (empData || initialEmployee || null) as Employee | null;
        if (activeEmp) {
          setCurrentEmployee(activeEmp);
          setEntitlement(activeEmp.annual_leave_days ?? 18);
        }

        let mgr: Employee | null = null;
        if (activeEmp?.reports_to) {
          const { data: mgrData } = await supabase
            .from("employees")
            .select("id, first_name, last_name, display_name, full_name, role, department, avatar_url, email, branch_id, employee_code, biometric_user_id")
            .eq("id", activeEmp.reports_to)
            .maybeSingle();
          if (mgrData && isMounted) {
            mgr = mgrData as Employee;
            const approver = formatKhmerFullName(mgrData);
            setMyApproverName(approver);
          }
        }

        const { data: hrStaff } = await supabase
          .from("employees")
          .select("id, first_name, last_name, display_name, full_name, role, department, avatar_url, email, branch_id, employee_code, biometric_user_id")
          .or("department.ilike.%hr%,role.ilike.%hr%")
          .is("deleted_at", null)
          .order("first_name");

        if (hrStaff && isMounted) setHrApprovers(hrStaff as Employee[]);

        const { data: policies } = await supabase
          .from("leave_type_policies")
          .select("type, default_days");
        if (policies && isMounted) setLeaveTypePolicies(policies as LeaveTypePolicy[]);

        const { data: allStaff } = await supabase
          .from("employees")
          .select("id, first_name, last_name, display_name, full_name, role, department, annual_leave_days, avatar_url, branch_id, email, reports_to, employee_code, biometric_user_id")
          .is("deleted_at", null)
          .order("first_name");

        if (isMounted) {
          const combined = [
            ...(allStaff || []),
            ...(activeEmp ? [activeEmp] : []),
            ...(mgr ? [mgr] : []),
            ...((hrStaff as Employee[]) || []),
          ];
          const uniqueStaff = Array.from(new Map(combined.map((item) => [item.id, item])).values());
          setAllEmployees(uniqueStaff);
        }
      } catch (err) {
        console.error("Error loading leave context metadata:", err);
      }
    }

    load();
    return () => { isMounted = false; };
  }, [employeeId, initialEmployee]);

  return {
    entitlement,
    currentEmployee,
    allEmployees,
    myApproverName,
    hrApprovers,
    leaveTypePolicies,
  };
}
