import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { Tool, ToolAssignment } from "../types";

interface UseToolsMutationsProps {
  actorName: string;
  canManage: boolean;
  loadData: () => Promise<void>;
  assignments: ToolAssignment[];
}

export function useToolsMutations({
  actorName,
  canManage,
  loadData,
  assignments,
}: UseToolsMutationsProps) {
  const [saving, setSaving] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignTargetTool, setAssignTargetTool] = useState<Tool | null>(null);
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignDeptFilter, setAssignDeptFilter] = useState("All");

  const openAssign = (tool: Tool) => {
    setAssignTargetTool(tool);
    setAssignEmployeeIds([]);
    setAssignSearch("");
    setAssignDeptFilter("All");
    setAssignModalOpen(true);
  };

  const handleGrantAccess = useCallback(async () => {
    if (!assignTargetTool || assignEmployeeIds.length === 0 || saving || !canManage) return;
    setSaving(true);

    const alreadyAssigned = new Set(
      assignments.filter((a) => a.tool_id === assignTargetTool.id).map((a) => a.employee_id)
    );
    const newIds = assignEmployeeIds.filter((id) => !alreadyAssigned.has(id));

    if (newIds.length === 0) {
      toast("Already Assigned", "All selected staff already have active access.", "warning");
      setSaving(false);
      return;
    }

    const payload = newIds.map((empId) => ({
      tool_id: assignTargetTool.id,
      employee_id: empId,
      assigned_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from("tool_assignments").insert(payload);
    if (error) {
      toast("Error", "Failed to grant tool permissions", "error");
    } else {
      toast("Access Granted", `Granted access to ${newIds.length} employee(s).`, "success");
      logActivity(
        "Granted Access",
        "Tools",
        `Granted access to ${assignTargetTool.name} for ${newIds.length} employee(s)`,
        actorName
      );
      setAssignModalOpen(false);
      setAssignEmployeeIds([]);
      await loadData();
    }
    setSaving(false);
  }, [assignTargetTool, assignEmployeeIds, saving, canManage, assignments, actorName, loadData]);

  const handleRevokeAccess = useCallback(
    async (assignmentId: number, empName: string, toolName: string) => {
      if (!canManage) return;
      const { error } = await supabase
        .from("tool_assignments")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", assignmentId);

      if (error) {
        toast("Error", "Failed to revoke tool permissions", "error");
      } else {
        toast("Access Revoked", `Revoked access from ${empName}.`, "success");
        logActivity(
          "Revoked Access",
          "Tools",
          `Revoked access to ${toolName} from ${empName}`,
          actorName
        );
        await loadData();
      }
    },
    [canManage, actorName, loadData]
  );

  const handleToggleStatus = useCallback(
    async (tool: Tool) => {
      if (!canManage) return;
      const newStatus = tool.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("tools")
        .update({ status: newStatus })
        .eq("id", tool.id);

      if (error) {
        toast("Error", "Failed to update tool status", "error");
      } else {
        toast(
          "Status Updated",
          `${tool.name} is now ${newStatus.toUpperCase()}`,
          "success"
        );
        logActivity(
          "Updated Tool",
          "Tools",
          `Changed status of ${tool.name} to ${newStatus}`,
          actorName
        );
        await loadData();
      }
    },
    [canManage, actorName, loadData]
  );

  return {
    saving,
    selectedTool,
    setSelectedTool,
    assignModalOpen,
    setAssignModalOpen,
    assignTargetTool,
    assignEmployeeIds,
    setAssignEmployeeIds,
    assignSearch,
    setAssignSearch,
    assignDeptFilter,
    setAssignDeptFilter,
    openAssign,
    handleGrantAccess,
    handleRevokeAccess,
    handleToggleStatus,
  };
}
