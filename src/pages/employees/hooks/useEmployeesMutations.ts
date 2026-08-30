import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import type { Employee, EmployeeFormState, AppRole } from "../types";
import { INITIAL_EMPLOYEE_FORM } from "../constants";

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
      setInvitingId(email);
      try {
        const { data: inviteData, error: inviteErr } = await supabase.rpc("invite_user_by_email", {
          p_email: email,
          p_display_name: `${firstName} ${lastName}`,
        });

        if (inviteErr) throw inviteErr;

        if (inviteData && !inviteData.success) {
          toast("Notice", inviteData.message || "Invite could not be sent.", "info");
          return false;
        }

        const matchedRole = roles.find((r) => r.name.toLowerCase() === (empRole || "").toLowerCase());
        if (matchedRole) {
          await supabase.from("user_role_assignments").upsert(
            {
              email: email.toLowerCase().trim(),
              role_id: matchedRole.id,
              created_by: actorName,
            },
            { onConflict: "email" }
          );
        }

        toast("Invite Sent", `An invite email has been sent to ${email}`, "success");
        await logActivity({
          module: "employees",
          action: "invited",
          entityType: "employee",
          actorName,
          actorRole: roleName,
          description: `Sent system invitation to ${email}`,
        });
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to send invitation.", "error");
        return false;
      } finally {
        setInvitingId(null);
      }
    },
    [roles, actorName, roleName]
  );

  const handleAddEmployee = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
        toast("Error", "Please fill in all required fields.", "error");
        return;
      }

      setSubmitting(true);
      try {
        const payload: any = {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          role: form.role.trim() || "Staff",
          department: form.department || "Engineering",
          status: form.status,
          branch_id: form.branch_id || targetBranch || null,
          default_work_location_id: form.default_work_location_id || null,
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
          description: `Added new employee ${form.first_name} ${form.last_name}`,
        });

        await notify({
          title: "New Team Member",
          message: `${form.first_name} ${form.last_name} joined the ${form.department} team.`,
          type: "employee",
          targetRole: "admin",
          link: `/employees?id=${newEmp.id}`,
        });

        if (form.send_invite) {
          await inviteUser(form.email, form.first_name, form.last_name, form.role);
        }

        setShowAddModal(false);
        setForm(INITIAL_EMPLOYEE_FORM);
        loadEmployees();
      } catch (err: any) {
        toast("Error", err.message || "Failed to add employee.", "error");
      } finally {
        setSubmitting(false);
      }
    },
    [form, targetBranch, actorName, roleName, inviteUser, loadEmployees]
  );

  const deleteEmployee = useCallback(
    async (emp: Employee) => {
      if (!confirm(`Are you sure you want to delete ${emp.first_name} ${emp.last_name}?`)) return;
      setDeletingId(emp.id);
      try {
        const { error } = await supabase
          .from("employees")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", emp.id);

        if (error) throw error;

        toast("Deleted", `${emp.first_name} ${emp.last_name} moved to trash.`, "success");
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
