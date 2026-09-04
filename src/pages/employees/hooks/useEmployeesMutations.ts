import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { sendUserInvite } from "@/pages/admin/api";
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

        const cleanEmail = form.email?.trim() ? form.email.trim().toLowerCase() : null;

        const payload = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: cleanEmail,
          phone: form.phone?.trim() || null,
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

        toast("Success", `${form.first_name} ${form.last_name} has been added.`, "success");
        await logActivity({
          module: "employees",
          action: "created",
          entityType: "employee",
          entityId: newEmp.id,
          actorName,
          actorRole: roleName,
          description: `Added new employee ${form.first_name} ${form.last_name}${cleanEmail ? ` (${cleanEmail})` : " (Biometric only)"}`,
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
        if ((err?.message?.includes("employees_email_unique_idx") || err?.code === "23505") && form.email) {
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
    form,
    setForm,
    submitting,
    invitingId,
    deletingId,
    handleAddEmployee,
    inviteUser,
    deleteEmployee,
  };
}
