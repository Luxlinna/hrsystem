import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee, LeaveRequest } from "@/features/time-attendance/leave/types";
import { normalizeLeaveRequest } from "@/features/time-attendance/leave/hooks/useLeaveData";
import { useSelfServiceLeaveMetadata } from "./useSelfServiceLeaveMetadata";

interface CachedLeaveData {
  employeeId: string;
  requests: LeaveRequest[];
  timestamp: number;
}

let cachedLeaveData: CachedLeaveData | null = null;

export function invalidateSelfServiceLeaveCache() {
  cachedLeaveData = null;
}

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
  const isCacheHit = Boolean(cachedLeaveData && cachedLeaveData.employeeId === employeeId);
  const [requests, setRequests] = useState<LeaveRequest[]>(() =>
    isCacheHit && cachedLeaveData ? cachedLeaveData.requests : []
  );
  const [loading, setLoading] = useState<boolean>(() => !isCacheHit);

  const meta = useSelfServiceLeaveMetadata({
    employeeId,
    initialEmployee,
  });

  const fetchLeave = useCallback(async () => {
    if (!employeeId) return;
    if (!cachedLeaveData || cachedLeaveData.employeeId !== employeeId) {
      setLoading(true);
    }
    try {
      let empIds = [employeeId];
      const matchEmail = meta.currentEmployee?.email || initialEmployee?.email;
      const matchPhone = meta.currentEmployee?.phone || initialEmployee?.phone;
      const matchFirst = meta.currentEmployee?.first_name || initialEmployee?.first_name;
      const matchLast = meta.currentEmployee?.last_name || initialEmployee?.last_name;

      const filters: string[] = [];
      if (matchEmail) filters.push(`email.ilike.${matchEmail.trim().toLowerCase()}`);
      if (matchPhone) filters.push(`phone.eq.${matchPhone.trim()}`);
      if (matchFirst && matchLast) {
        filters.push(`and(first_name.ilike.${matchFirst.trim()},last_name.ilike.${matchLast.trim()})`);
      }

      if (filters.length > 0) {
        const { data: siblings } = await supabase
          .from("employees")
          .select("id")
          .or(filters.join(","))
          .is("deleted_at", null);
        if (siblings && siblings.length > 0) {
          empIds = Array.from(new Set([...empIds, ...siblings.map((s) => s.id)]));
        }
      }

      let query = supabase
        .from("leave_requests")
        .select("id, employee_id, leave_type, start_date, end_date, days, status, reason, created_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (empIds.length === 1) {
        query = query.eq("employee_id", empIds[0]);
      } else {
        query = query.in("employee_id", empIds);
      }

      const { data } = await query;
      const normalized = ((data as LeaveRequest[]) || []).map(normalizeLeaveRequest);
      cachedLeaveData = { employeeId, requests: normalized, timestamp: Date.now() };
      setRequests(normalized);
    } catch (err) {
      console.error("Error fetching self-service leave:", err);
    } finally {
      setLoading(false);
    }
  }, [
    employeeId,
    meta.currentEmployee?.email,
    meta.currentEmployee?.phone,
    meta.currentEmployee?.first_name,
    meta.currentEmployee?.last_name,
    initialEmployee,
  ]);

  useEffect(() => {
    fetchLeave();
  }, [fetchLeave]);

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
          const updated = normalizeLeaveRequest(payload.new as LeaveRequest);
          setRequests((prev) => {
            const next = prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r));
            cachedLeaveData = { employeeId, requests: next, timestamp: Date.now() };
            return next;
          });
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
          const newReq = normalizeLeaveRequest(payload.new as LeaveRequest);
          setRequests((prev) => {
            const next = [newReq, ...prev];
            cachedLeaveData = { employeeId, requests: next, timestamp: Date.now() };
            return next;
          });
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
    entitlement: meta.entitlement,
    currentEmployee: meta.currentEmployee,
    allEmployees: meta.allEmployees,
    myApproverName: meta.myApproverName,
    hrApprovers: meta.hrApprovers,
    leaveTypePolicies: meta.leaveTypePolicies,
    fetchLeave,
  };
}
