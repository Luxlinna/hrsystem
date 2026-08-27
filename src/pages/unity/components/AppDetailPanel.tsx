import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import type { UnityApp, AppAccess, AppUsageLog, Employee } from "../types";
import { AppDetailHeader } from "./AppDetailHeader";
import { AppAccessTab } from "./AppAccessTab";
import { AppActivityTab } from "./AppActivityTab";
import { AppInfoTab } from "./AppInfoTab";
import { GrantAppAccessModal } from "./GrantAppAccessModal";

interface AppDetailPanelProps {
  app: UnityApp;
  accesses: AppAccess[];
  usageLogs: AppUsageLog[];
  employees: Employee[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function AppDetailPanel({
  app,
  accesses,
  usageLogs,
  employees,
  onClose,
  onRefresh,
}: AppDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<"access" | "activity" | "info">("access");
  const [grantModal, setGrantModal] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  const [selectedLevel, setSelectedLevel] = useState("user");
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const { role } = usePermissions();
  const granterName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const appLogs = usageLogs.filter((l) => l.app_id === app.id);
  const appAccesses = accesses.filter((a) => a.app_id === app.id && a.is_active);
  const totalMinutes = appLogs.reduce((s, l) => s + (l.duration_minutes || 0), 0);

  const grantedIds = new Set(appAccesses.map((a) => a.employee_id));
  const availableEmployees = employees.filter((e) => !grantedIds.has(e.id));

  const handleGrant = useCallback(async () => {
    if (selectedEmpIds.length === 0) return;
    setSaving(true);
    const payload = selectedEmpIds.map((empId) => ({
      app_id: app.id,
      employee_id: empId,
      access_level: selectedLevel,
      granted_by: granterName,
    }));
    const { error } = await supabase.from("app_access").insert(payload);
    setSaving(false);
    if (error) {
      toast("Error", "Failed to grant access", "error");
      return;
    }
    toast(
      "Success",
      `${selectedEmpIds.length} employee${selectedEmpIds.length === 1 ? "" : "s"} granted ${selectedLevel} access to ${app.name}.`,
      "success"
    );
    logActivity({
      module: "unity",
      action: "created",
      entityType: "app_access",
      actorName: granterName,
      actorRole: role?.name || "Unknown",
      description: `${selectedEmpIds.length} employee${selectedEmpIds.length === 1 ? "" : "s"} granted ${selectedLevel} access to ${app.name}`,
    });
    setGrantModal(false);
    setSelectedEmpIds([]);
    onRefresh();
  }, [selectedEmpIds, selectedLevel, granterName, app.id, app.name, role?.name, onRefresh]);

  const handleRevoke = useCallback(
    async (accessId: number, empName: string) => {
      const { error } = await supabase
        .from("app_access")
        .update({ is_active: false })
        .eq("id", accessId);
      if (error) {
        toast("Error", "Failed to revoke access", "error");
        return;
      }
      toast("Success", `Access revoked for ${empName}`, "success");
      logActivity({
        module: "unity",
        action: "updated",
        entityType: "app_access",
        actorName: granterName,
        actorRole: role?.name || "Unknown",
        description: `${empName}'s access to ${app.name} was revoked`,
      });
      onRefresh();
    },
    [granterName, role?.name, app.name, onRefresh]
  );

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-100">
      <div className="flex-1 bg-black/20" onClick={onClose} />
      <div className="w-full sm:w-[480px] bg-white h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header with App Info and Tabs */}
        <AppDetailHeader
          app={app}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={onClose}
        />

        {/* Tab Content */}
        <div className="flex-1 p-6">
          {activeTab === "access" && (
            <AppAccessTab
              appAccesses={appAccesses}
              onOpenGrant={() => setGrantModal(true)}
              onRevoke={handleRevoke}
            />
          )}

          {activeTab === "activity" && (
            <AppActivityTab appLogs={appLogs} totalMinutes={totalMinutes} />
          )}

          {activeTab === "info" && <AppInfoTab app={app} />}
        </div>
      </div>

      {/* Grant Access Modal */}
      <GrantAppAccessModal
        open={grantModal}
        app={app}
        availableEmployees={availableEmployees}
        selectedEmpIds={selectedEmpIds}
        setSelectedEmpIds={setSelectedEmpIds}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        saving={saving}
        onGrant={handleGrant}
        onClose={() => setGrantModal(false)}
      />
    </div>
  );
}