import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { sendUserInvite, createPhoneUserAccount } from "@/pages/admin/api";
import { normalizePhone } from "@/lib/phoneUtils";
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
      if (!form.first_name?.trim() || !form.last_name?.trim()) {
        toast("Required fields", "Please fill in first name and last name.", "error");
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

        const payload = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: cleanEmail,
          phone: cleanPhone,
          role: form.role?.trim() || "Staff",
          department: form.department,
          status: form.status,
          branch_id: resolvedBranch,
          default_work_location_id: resolvedLocation,
          join_date: form.join_date || new Date().toISOString().split("T")[0],
          reports_to: form.reports_to || null,
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

        toast("Success", `${form.first_name} ${form.last_name} has been added.`, "success");
        await logActivity({
          module: "employees",
          action: "created",
          entityType: "employee",
          entityId: newEmp.id,
          actorName,
          actorRole: roleName,
          description: `Added new employee ${form.first_name} ${form.last_name}${cleanEmail ? ` (${cleanEmail})` : cleanPhone ? ` (${cleanPhone})` : " (Biometric only)"}`,
        });

        await notify({
          title: "New Team Member",
          message: `${form.first_name} ${form.last_name} joined the ${form.department} team.`,
          type: "success",
          source: "employees",
          entityId: newEmp.id,
          branchId: form.branch_id || targetBranch || null,
        });

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
