import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { uploadFile } from "@/lib/storage";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/audit";
import type { Employee, ReportEntry } from "../types";

export function useEmployeeProfile(id: string | undefined) {
  const { role, isAdmin } = usePermissions();
  const { user } = useAuth();
  const canEdit = isAdmin || !!role?.employees_manage;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [manager, setManager] = useState<ReportEntry | null>(null);
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [form, setForm] = useState<Partial<Employee>>({});
  const [allEmployees, setAllEmployees] = useState<ReportEntry[]>([]);
  const loadRequestId = useRef(0);

  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [workSites, setWorkSites] = useState<{ id: string; name: string; branch_id: string }[]>([]);

  useEffect(() => {
    supabase.from("branches").select("id, name").is("deleted_at", null).order("name").then(({ data }) => {
      setBranches(data || []);
    });
    supabase.from("work_locations").select("id, name, branch_id").is("deleted_at", null).order("name").then(({ data }) => {
      setWorkSites(data || []);
    });
  }, []);

  const loadEmployee = useCallback(async (empId: string) => {
    setLoading(true);
    const requestId = ++loadRequestId.current;
    const { data: emp } = await supabase
      .from("employees")
      .select("*, branches(name), work_locations:default_work_location_id(name)")
      .eq("id", empId)
      .maybeSingle();

    if (requestId !== loadRequestId.current) return;

    if (!emp) {
      toast("Not found", "Employee not found", "error");
      setLoading(false);
      return;
    }

    setEmployee(emp as Employee);
    setForm(emp as Employee);

    // Load manager
    if (emp.reports_to) {
      const { data: mgr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role")
        .eq("id", emp.reports_to)
        .maybeSingle();
      if (mgr) setManager(mgr);
    } else {
      setManager(null);
    }

    // Load direct reports
    const { data: reps } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role")
      .eq("reports_to", empId);
    setReports(reps || []);

    // Load all employees for manager dropdown, filtered by system role
    const [all, roleData] = await Promise.all([
      supabase.from("employees").select("id, first_name, last_name, role, email"),
      supabase.from("user_role_assignments").select("email, app_roles(name)").is("deleted_at", null),
    ]);
    const managerEmails = new Set<string>();
    (roleData.data || []).forEach((row: any) => {
      if (/manager/i.test(row.app_roles?.name || "")) managerEmails.add(row.email?.toLowerCase());
    });
    const allEmps = (all.data || []).filter((e: any) => e.id !== empId);
    setAllEmployees(allEmps.filter((e: any) => managerEmails.has(e.email?.toLowerCase())));

    // Load interviews as interviewer
    const { data: ivs } = await supabase
      .from("interviews")
      .select("*, candidates(full_name, job_postings(title))")
      .eq("interviewer_id", empId)
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false });
    setInterviews(ivs || []);

    // Load leave requests
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("employee_id", empId)
      .order("created_at", { ascending: false })
      .limit(5);
    setLeaveRequests(leaves || []);

    // Load payroll
    const { data: pay } = await supabase
      .from("payroll_records")
      .select("*")
      .eq("employee_id", empId)
      .order("created_at", { ascending: false })
      .limit(5);
    setPayrollRecords(pay || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!id) return;
    loadEmployee(id);
  }, [id, loadEmployee]);

  const saveChanges = useCallback(async () => {
    if (!id || !employee || !canEdit) return;
    setSaving(true);
    const { error } = await supabase
      .from("employees")
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        department: form.department,
        branch_id: form.branch_id || null,
        default_work_location_id: form.default_work_location_id || null,
        status: form.status,
        join_date: form.join_date,
        reports_to: form.reports_to,
      })
      .eq("id", id);

    if (error) {
      toast("Error", error.message, "error");
    } else {
      toast("Saved", "Employee profile updated successfully", "success");
      setEditing(false);
      logActivity({
        module: "employees",
        action: "updated",
        entityType: "employee",
        entityId: id,
        actorName: (user?.user_metadata?.display_name as string) || user?.email || "Unknown",
        actorRole: role?.name || "Unknown",
        description: `Profile updated for ${form.first_name} ${form.last_name}`,
      });
      loadEmployee(id);
    }
    setSaving(false);
  }, [id, employee, canEdit, form, user, role?.name, loadEmployee]);

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!id || !canEdit) return;
      setUploadingAvatar(true);
      try {
        const url = await uploadFile("avatars", `employees/${id}/${Date.now()}_${file.name}`, file);
        await supabase.from("employees").update({ avatar_url: url }).eq("id", id);
        setEmployee((prev) => (prev ? { ...prev, avatar_url: url } : prev));
        toast("Avatar updated", "Profile picture saved", "success");
      } catch (err) {
        toast("Upload failed", err instanceof Error ? err.message : "Could not upload avatar", "error");
      }
      setUploadingAvatar(false);
    },
    [id, canEdit]
  );

  return {
    canEdit,
    employee,
    loading,
    editing,
    setEditing,
    saving,
    uploadingAvatar,
    manager,
    reports,
    interviews,
    leaveRequests,
    payrollRecords,
    form,
    setForm,
    allEmployees,
    branches,
    workSites,
    saveChanges,
    uploadAvatar,
  };
}
