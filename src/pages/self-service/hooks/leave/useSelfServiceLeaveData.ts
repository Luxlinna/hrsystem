import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee, LeaveRequest, LeaveTypePolicy } from "@/pages/leave/types";

interface UseSelfServiceLeaveDataProps {
  employeeId: string;
  initialEmployee?: Employee | null;
  onStatusToast: (type: "success" | "error", message: string) => void;
}

export function useSelfServiceLeaveData({
  employeeId,
  initialEmployee,
  onStatusToast,
}: UseSelfServiceLeaveDataProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [entitlement, setEntitlement] = useState(18);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(
    initialEmployee || null
  );
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [myApproverName, setMyApproverName] = useState<string>("");
  const [hrApprovers, setHrApprovers] = useState<Employee[]>([]);
  const [leaveTypePolicies, setLeaveTypePolicies] = useState<LeaveTypePolicy[]>([]);

  const fetchLeave = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    const { data } = await supabase
      .from("leave_requests")
      .select("id, employee_id, leave_type, start_date, end_date, days, status, reason, created_at")
      .eq("employee_id", employeeId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    setRequests((data as LeaveRequest[]) || []);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    fetchLeave();
  }, [fetchLeave]);

  useEffect(() => {
    if (!employeeId) return;
    let isMounted = true;

    async function loadMetadata() {
      try {
        const { data: empData } = await supabase
          .from("employees")
          .select(
            "id, first_name, last_name, role, department, annual_leave_days, avatar_url, branch_id, email, reports_to, employee_code, biometric_user_id"
          )
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
            .select(
              "id, first_name, last_name, role, department, avatar_url, email, branch_id, employee_code, biometric_user_id"
            )
            .eq("id", activeEmp.reports_to)
            .maybeSingle();
          if (mgrData && isMounted) {
            mgr = mgrData as Employee;
            setMyApproverName(`${mgrData.first_name} ${mgrData.last_name}`.trim());
          }
        }

        const { data: hrStaff } = await supabase
          .from("employees")
          .select(
            "id, first_name, last_name, role, department, avatar_url, email, branch_id, employee_code, biometric_user_id"
          )
          .or("department.ilike.%hr%,role.ilike.%hr%")
          .is("deleted_at", null)
          .order("first_name");

        if (hrStaff && isMounted) {
          setHrApprovers(hrStaff as Employee[]);
        }

        const { data: policies } = await supabase
          .from("leave_type_policies")
          .select("type, default_days");
        if (policies && isMounted) {
          setLeaveTypePolicies(policies as LeaveTypePolicy[]);
        }

        const { data: allStaff } = await supabase
          .from("employees")
          .select(
            "id, first_name, last_name, role, department, annual_leave_days, avatar_url, branch_id, email, reports_to, employee_code, biometric_user_id"
          )
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

    loadMetadata();
    return () => {
      isMounted = false;
    };
  }, [employeeId, initialEmployee]);

  // Real-time subscription: live updates without refresh
  useEffect(() => {
    if (!employeeId) return;
    const channel = supabase
      .channel(`leave-status-${employeeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leave_requests",
          filter: `employee_id=eq.${employeeId}`,
        },
        (payload) => {
          const updated = payload.new as LeaveRequest;
          setRequests((prev) =>
            prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
          );
          if (updated.status === "approved" || updated.status === "rejected") {
            onStatusToast(
              updated.status === "approved" ? "success" : "error",
              updated.status === "approved"
                ? "Your leave request was approved!"
                : "Your leave request was rejected."
            );
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leave_requests",
          filter: `employee_id=eq.${employeeId}`,
        },
        (payload) => {
          const newReq = payload.new as LeaveRequest;
          setRequests((prev) => [newReq, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeId, onStatusToast]);

  return {
    requests,
    loading,
    entitlement,
    currentEmployee,
    allEmployees,
    myApproverName,
    hrApprovers,
    leaveTypePolicies,
    fetchLeave,
  };
}
