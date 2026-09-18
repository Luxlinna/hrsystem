import { supabase } from "@/lib/supabase";
import { normalizePhone } from "@/lib/phoneUtils";
import { formatPaddedPin } from "@/lib/biometricUtils";
import { logActivity } from "@/lib/audit";
import type { Employee } from "../types";

export interface SaveProfileParams {
  id: string;
  employee: Employee;
  form: Partial<Employee>;
  user: any;
  roleName?: string;
  toast: (title: string, message: string, type?: "success" | "error" | "info" | "warning") => void;
  loadEmployee: (empId: string) => Promise<void>;
  setSaving: (saving: boolean) => void;
  setEditing: (editing: boolean) => void;
}

export async function executeSaveEmployeeProfile({
  id,
  employee,
  form,
  user,
  roleName,
  toast,
  loadEmployee,
  setSaving,
  setEditing,
}: SaveProfileParams): Promise<void> {
  setSaving(true);
  const cleanEmail = form.email?.trim() ? form.email.trim().toLowerCase() : null;
  const cleanPhone = form.phone?.trim() || null;

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
      nssf_number: form.nssf_info?.identity_code?.trim() || form.nssf_number?.trim() || null,
      register_nssf: Boolean(form.register_nssf || form.nssf_info?.register_nssf || form.nssf_info?.identity_code?.trim() || form.nssf_number?.trim()),
      hiring_info: {
        ...((employee as any)?.hiring_info || {}),
        nssf_info: form.nssf_info || null,
      },
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
      toast("Phone Number Already Registered", `An employee with phone number "${form.phone}" already exists in the system. Duplicate phone numbers are not allowed.`, "error");
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
      actorRole: roleName || "Unknown",
      description: `Profile updated for ${form.first_name} ${form.last_name}`,
    });
    loadEmployee(id);
  }
  setSaving(false);
}
