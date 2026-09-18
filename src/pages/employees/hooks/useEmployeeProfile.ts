import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { uploadMediaToS3 } from "@/lib/s3-storage";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { executeSaveEmployeeProfile } from "./saveEmployeeProfile";
import { loadEmployeeRelations } from "./employeeProfileLoader";
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
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [userManagementUsers, setUserManagementUsers] = useState<any[]>([]);
  const [managersList, setManagersList] = useState<ReportEntry[]>([]);
  const loadRequestId = useRef(0);

  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [workSites, setWorkSites] = useState<{ id: string; name: string; branch_id: string }[]>([]);
  const [hasBiometricDevice, setHasBiometricDevice] = useState(false);

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

    const nssfInfo = emp.nssf_info || emp.hiring_info?.nssf_info || {
      register_nssf: Boolean(emp.register_nssf || emp.nssf_number),
      identity_code: emp.nssf_number || "",
      joining_date: emp.join_date || new Date().toISOString().slice(0, 10),
      first_name_kh: emp.kh_name ? emp.kh_name.split(" ")[1] || "" : "",
      last_name_kh: emp.kh_name ? emp.kh_name.split(" ")[0] || "" : "",
      first_name_latin: emp.first_name || "",
      last_name_latin: emp.last_name || "",
      monthly_wage_type: "Formula",
      monthly_wage: "Taxable Salary",
      seniority_pension_fund: "",
      remark: "",
      status: "Active",
    };
    const resolvedEmp = { ...emp, nssf_info: nssfInfo };
    setEmployee(resolvedEmp as Employee);
    setForm(resolvedEmp as Employee);

    if (emp.branch_id) {
      supabase
        .from("biometric_devices")
        .select("id, branch_id, work_location_id")
        .eq("branch_id", emp.branch_id)
        .then(({ data }) => {
          if (!data || data.length === 0) {
            setHasBiometricDevice(false);
            return;
          }
          const matches = data.some((dev: any) => {
            if (emp.default_work_location_id) {
              return dev.work_location_id === emp.default_work_location_id || !dev.work_location_id;
            }
            return !dev.work_location_id;
          });
          setHasBiometricDevice(matches);
        });
    } else {
      setHasBiometricDevice(false);
    }

    const rels = await loadEmployeeRelations(empId, emp);
    setManager(rels.manager);
    setReports(rels.reports);
    setAllEmployees(rels.allEmployees);
    setUserManagementUsers(rels.userManagementUsers || []);
    setManagersList(rels.managersList);
    setInterviews(rels.interviews);
    setLeaveRequests(rels.leaveRequests);
    setPayrollRecords(rels.payrollRecords);

    setLoading(false);
  }, []);

  useEffect(() => {
    if (!id) return;
    loadEmployee(id);
  }, [id, loadEmployee]);

  const saveChanges = useCallback(async () => {
    if (!id || !employee || !canEdit) return;
    await executeSaveEmployeeProfile({
      id,
      employee,
      form,
      user,
      roleName: role?.name,
      toast,
      loadEmployee,
      setSaving,
      setEditing,
    });
  }, [id, employee, canEdit, form, user, role?.name, loadEmployee]);

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!id || !canEdit) return;
      setUploadingAvatar(true);
      try {
        const media = await uploadMediaToS3(file, `employees/${id}/avatars`);
        const url = media.url;
        await supabase.from("employees").update({ avatar_url: url }).eq("id", id);
        setEmployee((prev) => (prev ? { ...prev, avatar_url: url } : prev));
        toast("Avatar updated", "Profile picture stored on AWS S3", "success");
      } catch (err) {
        toast("Upload failed", err instanceof Error ? err.message : "Could not upload avatar to AWS S3", "error");
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
    userManagementUsers,
    managersList,
    branches,
    workSites,
    hasBiometricDevice,
    loadEmployee,
    saveChanges,
    uploadAvatar,
  };
}
