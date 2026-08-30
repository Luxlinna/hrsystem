import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { Employee } from "../types";

interface UseEmployeesSelectionProps {
  pagedEmployees: Employee[];
  actorName: string;
  roleName: string;
  loadEmployees: () => void;
  inviteUser: (email: string, firstName: string, lastName: string, roleName: string) => Promise<boolean>;
}

export function useEmployeesSelection({
  pagedEmployees,
  actorName,
  roleName,
  loadEmployees,
  inviteUser,
}: UseEmployeesSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = useCallback(() => {
    if (selectAll || selectedIds.size > 0) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      setSelectedIds(new Set(pagedEmployees.map((e) => e.id)));
      setSelectAll(true);
    }
  }, [selectAll, selectedIds.size, pagedEmployees]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const bulkInvite = useCallback(async () => {
    const toInvite = pagedEmployees.filter((e) => selectedIds.has(e.id));
    let successCount = 0;
    for (const emp of toInvite) {
      const ok = await inviteUser(emp.email, emp.first_name, emp.last_name, emp.role || "");
      if (ok) successCount++;
    }
    toast("Bulk Invites", `Sent ${successCount} of ${toInvite.length} invites.`, "success");
    setSelectedIds(new Set());
    setSelectAll(false);
  }, [pagedEmployees, selectedIds, inviteUser]);

  const bulkDelete = useCallback(async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.size} employees?`)) return;
    const toDelete = pagedEmployees.filter((e) => selectedIds.has(e.id));
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("employees")
      .update({ deleted_at: now, deleted_by: actorName || "Admin" })
      .in("id", Array.from(selectedIds));

    if (error) {
      toast("Error", error.message, "error");
      return;
    }

    const emails = toDelete.map((e) => e.email?.trim().toLowerCase()).filter(Boolean);
    if (emails.length > 0) {
      await supabase
        .from("user_role_assignments")
        .update({
          deleted_at: now,
          deleted_by: actorName || "Admin",
          role_id: null,
          updated_at: now,
        })
        .in("email", emails);
    }

    toast("Deleted", `${selectedIds.size} employees and associated user accounts moved to trash.`, "success");
    await logActivity({
      module: "employees",
      action: "deleted",
      entityType: "employee",
      actorName,
      actorRole: roleName,
      description: `Bulk deleted ${selectedIds.size} employees`,
    });

    setSelectedIds(new Set());
    setSelectAll(false);
    loadEmployees();
  }, [selectedIds, pagedEmployees, actorName, roleName, loadEmployees]);

  return {
    selectedIds,
    setSelectedIds,
    selectAll,
    setSelectAll,
    handleSelectAll,
    handleSelectOne,
    bulkInvite,
    bulkDelete,
  };
}
