import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { uploadMediaToS3 } from "@/lib/s3-storage";
import { uploadFile } from "@/lib/storage";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/audit";
import { normalizePhone } from "@/lib/phoneUtils";
import { formatPaddedPin } from "@/lib/biometricUtils";
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

    setEmployee(emp as Employee);
    setForm(emp as Employee);

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

    const cleanEmail = form.email?.trim() ? form.email.trim().toLowerCase() : null;
    const cleanPhone = form.phone?.trim() || null;

    // Check duplicate phone
    if (cleanPhone) {
      const normPhone = normalizePhone(cleanPhone);
      if (normPhone && normPhone.length >= 6) {
        const { data: existingPhoneRows } = await supabase
          .from("employees")
          .select("id, first_name, last_name, phone")
          .neq("id", id)
          .is("deleted_at", null)
          .or(`phone.ilike.%${normPhone}%,phone.eq.${cleanPhone}`)
          .limit(10);

        const dupPhoneEmp = (existingPhoneRows || []).find((e) => {
          if (!e.phone) return false;
          return normalizePhone(e.phone) === normPhone;
        });

        if (dupPhoneEmp) {
          toast(
            "Phone Number Already Registered",
            `An employee (${dupPhoneEmp.first_name} ${dupPhoneEmp.last_name}) already has the phone number "${cleanPhone}". Duplicate phone numbers are not allowed.`,
            "error"
          );
          setSaving(false);
          return;
        }
      }
    }

    // Check duplicate email
    if (cleanEmail) {
      const { data: existingEmailRows } = await supabase
        .from("employees")
        .select("id, first_name, last_name, email")
        .neq("id", id)
        .is("deleted_at", null)
        .ilike("email", cleanEmail)
        .limit(1);

      if (existingEmailRows && existingEmailRows.length > 0) {
        const dupEmailEmp = existingEmailRows[0];
        toast(
          "Email Already Registered",
          `An employee (${dupEmailEmp.first_name} ${dupEmailEmp.last_name}) already has the email "${cleanEmail}". Duplicate emails are not allowed.`,
          "error"
        );
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("employees")
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        kh_name: form.kh_name,
        display_name: form.display_name,
        foreign_name: form.foreign_name,
        title: form.title,
        gender: form.gender,
        date_of_birth: form.date_of_birth,
        marital_status: form.marital_status,
        nationality: form.nationality,
        religion: form.religion,
        blood_group: form.blood_group,
        is_resident: form.is_resident,
        fringe_benefit: form.fringe_benefit,
        employee_tax_number: form.employee_tax_number,
        national_id_number:
          form.national_id_number ||
          (form.identifications?.[0]?.identification_number
            ? form.identifications[0].identification_number.trim()
            : null),
        identifications: form.identifications || [],
        emergency_contacts: form.emergency_contacts || [],
        emergency_contact_name:
          form.emergency_contact_name ||
          form.emergency_contacts?.[0]?.contact_person ||
          null,
        emergency_phone_number:
          form.emergency_phone_number ||
          form.emergency_contacts?.[0]?.phone_number ||
          null,
        family_members: form.family_members || [],
        achievement_history: form.achievement_history || [],
        permanent_address: form.permanent_address,
        permanent_city: form.permanent_city,
        permanent_province: form.permanent_province,
        current_address: form.current_address,
        home_phone: form.home_phone,
        code_bu: form.code_bu,
        bu_full_name: form.bu_full_name,
        handle_bu: form.handle_bu,
        position: form.position || form.role,
        contract_type: form.contract_type,
        contract_effective_date: form.contract_effective_date,
        contract_end_date: form.contract_end_date,
        contract_remark: form.contract_remark,
        working_hour: form.working_hour,
        total_working_days: form.total_working_days,
        working_location: form.working_location,
        site: form.site,
        email: cleanEmail,
        phone: cleanPhone,
        role: form.role,
        department: form.department,
        branch_id: form.branch_id || null,
        default_work_location_id: form.default_work_location_id || null,
        status: form.status,
        join_date: form.join_date,
        reports_to: form.reports_to,
        biometric_user_id: form.biometric_user_id?.trim() ? formatPaddedPin(form.biometric_user_id.trim()) : null,
      })
      .eq("id", id);

    if (error) {
      if (error?.message?.includes("employees_phone_unique_idx") || (error?.code === "23505" && (error?.message?.includes("phone") || form.phone))) {
        toast(
          "Phone Number Already Registered",
          `An employee with phone number "${form.phone}" already exists in the system. Duplicate phone numbers are not allowed.`,
          "error"
        );
      } else if (error?.message?.includes("employees_email_unique_idx") || (error?.code === "23505" && form.email)) {
        toast("Email Already Registered", `An employee with the email "${form.email}" already exists in the system. Please use a different email address.`, "error");
      } else {
        toast("Error", error.message, "error");
      }
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
        let url: string;
        try {
          const media = await uploadMediaToS3(file, `employees/${id}/avatars`);
          url = media.url;
        } catch {
          url = await uploadFile("avatars", `employees/${id}/${Date.now()}_${file.name}`, file);
        }
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
    branches,
    workSites,
    hasBiometricDevice,
    saveChanges,
    uploadAvatar,
  };
}
