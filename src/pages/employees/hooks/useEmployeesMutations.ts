import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { sendUserInvite, createPhoneUserAccount } from "@/pages/admin/api";
import { normalizePhone } from "@/lib/phoneUtils";
import { formatPaddedPin } from "@/lib/biometricUtils";
import { startOnboardingForEmployee } from "@/lib/onboarding";
import { INITIAL_EMPLOYEE_FORM } from "../constants";
import type { Employee, EmployeeFormState, AppRole } from "../types";

interface UseEmployeesMutationsProps {
  actorName: string;
  roleName: string;
  targetBranch: string | null;
  roles: AppRole[];
  loadEmployees: () => void;
}

export function useEmployeesMutations({
  actorName,
  roleName,
  targetBranch,
  roles,
  loadEmployees,
}: UseEmployeesMutationsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [phoneAccountEmployee, setPhoneAccountEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(INITIAL_EMPLOYEE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const inviteUser = useCallback(
    async (email: string, firstName: string, lastName: string, empRole: string) => {
      if (!email) {
        toast("Missing email", "Cannot invite employee without an email address.", "error");
        return false;
      }
      setInvitingId(email);
      try {
        const staffRole = roles.find((r) => r.name.toLowerCase() === "staff") || roles[0];
        const roleId = staffRole?.id ? String(staffRole.id) : null;
        const displayName = `${firstName} ${lastName}`.trim();

        const { res, result } = await sendUserInvite({
          email,
          display_name: displayName,
          role_id: roleId,
        });

        if (!res.ok || result.error) {
          const detailMsg = [result.error, result.detail].filter(Boolean).join(" — ");
          toast("Invitation Failed", detailMsg || "Could not send invite.", "error");
          return false;
        }

        toast("Invite Sent", `Sent invitation to ${email}`, "success");
        await logActivity({
          module: "employees",
          action: "invited",
          entityType: "employee",
          actorName,
          actorRole: roleName,
          description: `Invited user ${email} as ${empRole || "Staff"}`,
        });
        loadEmployees();
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to invite user.", "error");
        return false;
      } finally {
        setInvitingId(null);
      }
    },
    [roles, actorName, roleName, loadEmployees]
  );

  const setUpPhoneUser = useCallback(
    async (data: {
      employeeId: string;
      phone: string;
      password?: string;
      displayName: string;
      roleId?: string | number | null;
      sendInvite?: boolean;
    }) => {
      try {
        const { res, result } = await createPhoneUserAccount({
          employeeId: data.employeeId,
          phone: data.phone,
          password: data.password,
          displayName: data.displayName,
          roleId: data.roleId || null,
          sendInvite: data.sendInvite,
        });

        if (!res.ok || result.error) {
          const detailMsg = [result.error, result.detail].filter(Boolean).join(" — ");
          toast("Setup Failed", detailMsg || "Could not set up phone account.", "error");
          return false;
        }

        toast(
          data.sendInvite ? "Invite Ready" : "Account Created",
          data.sendInvite
            ? `Telegram invite link generated for ${data.displayName}`
            : `Account successfully created for ${data.displayName}`,
          "success"
        );
        await logActivity({
          module: "employees",
          action: "created",
          entityType: "employee",
          entityId: data.employeeId,
          actorName,
          actorRole: roleName,
          description: data.sendInvite
            ? `Generated Telegram setup invite for ${data.displayName} (${data.phone})`
            : `Set up phone account and password for ${data.displayName} (${data.phone})`,
        });
        loadEmployees();
        return result.invite_link ? (result.invite_link as string) : true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to set up account.", "error");
        return false;
      }
    },
    [actorName, roleName, loadEmployees]
  );

  const handleAddEmployee = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const resolvedFullName = form.full_name?.trim() || `${form.first_name || ""} ${form.last_name || ""}`.trim();
      let resolvedFirstName = form.first_name?.trim() || "";
      let resolvedLastName = form.last_name?.trim() || "";
      if ((!resolvedFirstName || !resolvedLastName) && resolvedFullName) {
        const parts = resolvedFullName.split(/\s+/);
        resolvedFirstName = parts[0] || "";
        resolvedLastName = parts.slice(1).join(" ") || parts[0] || "";
      }

      if (!resolvedFirstName && !resolvedFullName) {
        toast("Required fields", "Please fill in employee full name.", "error");
        return;
      }
      setSubmitting(true);
      try {
        let resolvedBranch = form.branch_id || targetBranch || null;
        let resolvedLocation = form.default_work_location_id || null;
        if (resolvedBranch && resolvedBranch.startsWith("site:")) {
          resolvedLocation = resolvedBranch.substring(5);
          resolvedBranch = targetBranch || null;
        }

        let cleanEmail = form.email?.trim() ? form.email.trim().toLowerCase() : null;
        let cleanPhone = form.phone?.trim() || null;

        // Auto-detect if user typed phone into email or email into phone
        if (cleanEmail && !cleanEmail.includes("@") && /\d/.test(cleanEmail)) {
          if (!cleanPhone) cleanPhone = cleanEmail;
          cleanEmail = null;
        } else if (cleanPhone && cleanPhone.includes("@")) {
          if (!cleanEmail) cleanEmail = cleanPhone.toLowerCase();
          cleanPhone = null;
        }

        // Check for duplicate phone number
        if (cleanPhone) {
          const normPhone = normalizePhone(cleanPhone);
          if (normPhone && normPhone.length >= 6) {
            const { data: existingPhoneRows } = await supabase
              .from("employees")
              .select("id, first_name, last_name, phone")
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
              setSubmitting(false);
              return;
            }
          }
        }

        // Check for duplicate email
        if (cleanEmail) {
          const { data: existingEmailRows } = await supabase
            .from("employees")
            .select("id, first_name, last_name, email")
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
            setSubmitting(false);
            return;
          }
        }

        // Ensure sequential 3-digit padded ID from 001 for each BU
        let resolvedBiometricId: string | null = null;
        if (form.biometric_user_id?.trim()) {
          resolvedBiometricId = formatPaddedPin(form.biometric_user_id.trim());
        } else if (resolvedBranch) {
          const { data: existingPins } = await supabase
            .from("employees")
            .select("biometric_user_id")
            .eq("branch_id", resolvedBranch)
            .is("deleted_at", null);
          const pins = (existingPins || [])
            .map((e) => parseInt(String(e.biometric_user_id || "").replace(/\D/g, ""), 10))
            .filter((n) => !isNaN(n));
          const maxPin = pins.length > 0 ? Math.max(...pins) : 0;
          resolvedBiometricId = String(maxPin + 1).padStart(3, "0");
        }

        const payload = {
          // Personal Info & Identity
          title: form.title || "Mr",
          first_name: resolvedFirstName,
          last_name: resolvedLastName,
          full_name: resolvedFullName,
          display_name: form.display_name?.trim() || resolvedFullName,
          foreign_name: form.foreign_name?.trim() || null,
          employee_code: form.employee_code?.trim() || resolvedBiometricId || null,
          kh_name: form.kh_name?.trim() || null,
          gender: form.gender || "Male",
          date_of_birth: form.date_of_birth || null,
          marital_status: form.marital_status || "Single",
          nationality: form.nationality || "Khmer",
          is_resident: form.is_resident !== false,
          fringe_benefit: Boolean(form.fringe_benefit),
          blood_group: form.blood_group || "None",
          religion: form.religion || "None",
          employee_tax_number: form.employee_tax_number?.trim() || null,
          national_id_number: form.national_id_number?.trim() || form.identifications?.[0]?.identification_number?.trim() || null,
          bank_accounts: form.bank_accounts || [],
          identifications: form.identifications || [],
          permanent_address: form.permanent_address?.trim() || null,
          permanent_city: form.permanent_city?.trim() || null,
          permanent_province: form.permanent_province?.trim() || null,
          permanent_postal_code: form.permanent_postal_code?.trim() || null,
          permanent_country: form.permanent_country || "Cambodia",
          same_as_present_address: form.same_as_present_address !== false,
          home_phone: form.home_phone?.trim() || null,
          office_phone: form.office_phone?.trim() || null,
          emergency_contacts: form.emergency_contacts || [],
          family_members: form.family_members || [],
          education_history: form.education_history || [],
          training_history: form.training_history || [],
          employment_history: form.employment_history || [],
          achievement_history: form.achievement_history || [],
          personal_attachments: form.personal_attachments || [],

          code_bu: form.code_bu?.trim() || null,
          bu_full_name: form.bu_full_name?.trim() || null,
          handle_bu: form.handle_bu?.trim() || null,
          division: form.division?.trim() || null,
          department: form.department || null,
          position: form.position?.trim() || form.role?.trim() || "Staff",
          role: form.role?.trim() || form.position?.trim() || "Staff",
          site: form.site?.trim() || null,
          working_location: form.working_location?.trim() || null,

          working_hour: form.working_hour?.trim() || null,
          total_working_days: form.total_working_days?.trim() || null,
          employment_type: form.employment_type || "Full Time",
          start_date: form.start_date || form.join_date || new Date().toISOString().split("T")[0],
          join_date: form.join_date || form.start_date || new Date().toISOString().split("T")[0],
          line_manager: form.line_manager?.trim() || null,
          reports_to: form.reports_to || null,
          contract_type: form.contract_type || "FDC",
          fdc_end_date: form.fdc_end_date || null,
          contract_effective_date: form.contract_effective_date || null,
          contract_end_date: form.contract_end_date || null,
          contract_rate: form.contract_rate ? parseFloat(String(form.contract_rate)) : null,
          contract_rate_currency: form.contract_rate_currency || "USD",
          contract_rate_frequency: form.contract_rate_frequency || "Monthly",
          contract_rate_after: form.contract_rate_after ? parseFloat(String(form.contract_rate_after)) : null,
          contract_rate_after_currency: form.contract_rate_after_currency || "USD",
          contract_rate_after_frequency: form.contract_rate_after_frequency || "Monthly",
          contract_remark: form.contract_remark?.trim() || null,
          hiring_status: form.hiring_status || "probation",
          status: form.status || "onboarding",

          basic_salary: form.basic_salary ? parseFloat(String(form.basic_salary)) : null,
          tax_method: form.tax_method || "Resident",
          allowance: form.allowance?.trim() || null,
          bank_account_number: form.bank_account_number?.trim() || null,
          bank_name: form.bank_name?.trim() || null,
          nssf_number: form.nssf_number?.trim() || null,
          register_nssf: Boolean(form.register_nssf),
          payroll_structure: form.payroll_structure || "Standard Monthly",
          apply_day_in_month: Boolean(form.apply_day_in_month),
          apply_working_hours_per_day: Boolean(form.apply_working_hours_per_day),
          tax_salary: form.tax_salary ? parseFloat(String(form.tax_salary)) : null,
          tax_salary_currency: form.tax_salary_currency || "USD",
          tax_salary_frequency: form.tax_salary_frequency || "Monthly",
          rate_items: form.rate_items || [],
          payroll_attachments: form.payroll_attachments || [],
          asset_bookings: form.asset_bookings || [],
          asset_attachments: form.asset_attachments || [],

          email: cleanEmail,
          phone: cleanPhone,
          current_address: form.current_address?.trim() || null,
          emergency_contact_name: form.emergency_contact_name?.trim() || null,
          emergency_phone_number: form.emergency_phone_number?.trim() || null,
          avatar_url: form.avatar_url?.trim() || null,
          documents: form.documents || [],

          branch_id: resolvedBranch,
          default_work_location_id: resolvedLocation,
          biometric_user_id: resolvedBiometricId,
        };

        const { data: newEmp, error } = await supabase.from("employees").insert(payload).select().single();
        if (error) throw error;

        // Automatically initialize onboarding journey if created in onboarding status
        if (form.status === "onboarding" && newEmp?.id) {
          try {
            await startOnboardingForEmployee(newEmp.id, actorName);
          } catch (obErr) {
            console.error("Failed to initialize onboarding journey for new employee:", obErr);
          }
        }

        // Link booked assets in it_assets table
        if (form.asset_bookings && form.asset_bookings.length > 0 && newEmp?.id) {
          try {
            const tags = form.asset_bookings.map((b) => b.tag).filter(Boolean);
            if (tags.length > 0) {
              await supabase
                .from("it_assets")
                .update({ employee_id: newEmp.id, status: "active" })
                .in("asset_tag", tags);
            }
          } catch (assetErr) {
            console.warn("Failed to update it_assets status for new employee:", assetErr);
          }
        }

        toast("Success", `${resolvedFullName} has been added with hiring records.`, "success");
        await logActivity({
          module: "employees",
          action: "created",
          entityType: "employee",
          entityId: newEmp.id,
          actorName,
          actorRole: roleName,
          description: `Added new employee ${resolvedFullName}${cleanEmail ? ` (${cleanEmail})` : cleanPhone ? ` (${cleanPhone})` : " (Biometric only)"}`,
        });

        await notify({
          title: "New Team Member",
          message: `${form.first_name} ${form.last_name} joined the ${form.department} team.`,
          type: "success",
          source: "employees",
          entityId: newEmp.id,
          branchId: form.branch_id || targetBranch || null,
        });

        try {
          localStorage.removeItem("hr_add_employee_draft");
        } catch {}

        setShowAddModal(false);
        setForm(INITIAL_EMPLOYEE_FORM);
        loadEmployees();
      } catch (err: any) {
        if (err?.message?.includes("employees_phone_unique_idx") || (err?.code === "23505" && (err?.message?.includes("phone") || form.phone))) {
          toast(
            "Phone Number Already Registered",
            `An employee with phone number "${form.phone}" already exists in the system. Duplicate phone numbers are not allowed.`,
            "error"
          );
        } else if (err?.message?.includes("employees_email_unique_idx") || (err?.code === "23505" && form.email)) {
          toast("Email Already Registered", `An employee with the email "${form.email}" already exists in the system. Please use a different email address.`, "error");
        } else {
          toast("Error", err.message || "Failed to add employee.", "error");
        }
      } finally {
        setSubmitting(false);
      }
    },
    [form, targetBranch, actorName, roleName, loadEmployees]
  );

  const deleteEmployee = useCallback(
    async (emp: Employee) => {
      if (!confirm(`Are you sure you want to delete ${emp.first_name} ${emp.last_name}?`)) return;
      setDeletingId(emp.id);
      try {
        const now = new Date().toISOString();
        const { error } = await supabase
          .from("employees")
          .update({ deleted_at: now, deleted_by: actorName || "Admin" })
          .eq("id", emp.id);

        if (error) throw error;

        if (emp.email) {
          const normEmail = emp.email.trim().toLowerCase();
          await supabase
            .from("user_role_assignments")
            .update({
              deleted_at: now,
              deleted_by: actorName || "Admin",
              role_id: null,
              updated_at: now,
            })
            .eq("email", normEmail);
        }

        toast("Deleted", `${emp.first_name} ${emp.last_name} removed and deleted from user management.`, "success");
        await logActivity({
          module: "employees",
          action: "deleted",
          entityType: "employee",
          entityId: emp.id,
          actorName,
          actorRole: roleName,
          description: `Deleted employee ${emp.first_name} ${emp.last_name}`,
        });
        loadEmployees();
      } catch (err: any) {
        toast("Error", err.message || "Failed to delete employee.", "error");
      } finally {
        setDeletingId(null);
      }
    },
    [actorName, roleName, loadEmployees]
  );

  return {
    showAddModal,
    setShowAddModal,
    phoneAccountEmployee,
    setPhoneAccountEmployee,
    form,
    setForm,
    submitting,
    invitingId,
    deletingId,
    handleAddEmployee,
    inviteUser,
    setUpPhoneUser,
    deleteEmployee,
  };
}
