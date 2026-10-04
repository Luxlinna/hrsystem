import { useState, useMemo, useEffect, memo } from "react";
import { useBranchScope } from "@/context/BranchContext";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { BiometricPolicyToggleCard } from "./BiometricPolicyToggleCard";
import { ScanWindowsGrid } from "./ScanWindowsGrid";

export const BiometricScanWindowsSection = memo(function BiometricScanWindowsSection() {
  const { visibleBranches, selectedBranchId, setSelectedBranchId, refreshBranches } = useBranchScope();

  // Dynamically resolve target from global topbar selection
  const currentTargetId = useMemo(() => {
    if (selectedBranchId && selectedBranchId !== "all") {
      const match = visibleBranches.find((b) => b.id === selectedBranchId);
      if (match) return match.id;
    }
    return visibleBranches[0]?.id || "";
  }, [visibleBranches, selectedBranchId]);

  const [selectedTargetId, setSelectedTargetId] = useState<string>(currentTargetId);
  const [toggling, setToggling] = useState(false);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [localTimes, setLocalTimes] = useState<Record<string, string>>({});
  const [overridePolicies, setOverridePolicies] = useState<Record<string, boolean>>({});

  // Sync whenever user switches BU from top navigation
  useEffect(() => {
    if (currentTargetId) {
      setSelectedTargetId(currentTargetId);
      setLocalTimes({});
    }
  }, [currentTargetId]);

  const activeTarget =
    visibleBranches.find((b) => b.id === selectedTargetId) || visibleBranches[0];

  const isFourPunch =
    activeTarget && activeTarget.id in overridePolicies
      ? Boolean(overridePolicies[activeTarget.id])
      : Boolean(activeTarget?.is_four_punch_enabled);

  const handleToggle = async (checked: boolean) => {
    if (!activeTarget) return;
    setToggling(true);
    setOverridePolicies((prev) => ({ ...prev, [activeTarget.id]: checked }));
    try {
      if (activeTarget.is_site) {
        const siteId = activeTarget.id.replace("site:", "");
        await supabase.from("work_locations").update({ is_four_punch_enabled: checked }).eq("id", siteId);
      } else {
        await supabase.from("system_settings").upsert(
          { key: `bu_four_punch_${activeTarget.id}`, value: String(checked), updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
        const { data: locs } = await supabase.from("work_locations").select("id").eq("branch_id", activeTarget.id).is("deleted_at", null);
        if (locs && locs.length > 0) {
          await supabase.from("work_locations").update({ is_four_punch_enabled: checked }).eq("branch_id", activeTarget.id);
        } else {
          await supabase.from("work_locations").insert({
            branch_id: activeTarget.id,
            name: `${activeTarget.name} Main Site`,
            is_default: true,
            is_four_punch_enabled: checked,
          });
        }
      }
      await refreshBranches();
      toast(
        "Attendance Policy Updated",
        `${activeTarget.name} is now in ${checked ? "4-Punch Mode" : "Standard 2-Punch Mode"}.`,
        "success"
      );
    } catch {
      setOverridePolicies((prev) => ({ ...prev, [activeTarget.id]: !checked }));
      toast("Update Failed", "Could not update punch policy for this BU.", "error");
    } finally {
      setToggling(false);
    }
  };

  const handleTimeChange = (key: string, val: string) => {
    if (!activeTarget) return;
    setLocalTimes((prev) => ({ ...prev, [`${activeTarget.id}_${key}`]: val }));
  };

  const getWindowTime = (key: string) => {
    if (!activeTarget) return "";
    const local = localTimes[`${activeTarget.id}_${key}`];
    if (local !== undefined) return local;
    return (activeTarget as any)?.[key]?.slice(0, 5) || "";
  };

  const handleSaveField = async (key: string) => {
    if (!activeTarget) return;
    const timeVal = getWindowTime(key);
    setSavingField(key);
    try {
      const valToSave = timeVal ? `${timeVal}:00` : null;
      if (activeTarget.is_site) {
        const siteId = activeTarget.id.replace("site:", "");
        await supabase.from("work_locations").update({ [key]: valToSave }).eq("id", siteId);
      } else {
        await supabase.from("branches").update({ [key]: valToSave }).eq("id", activeTarget.id);
        await supabase.from("work_locations").update({ [key]: valToSave }).eq("branch_id", activeTarget.id);
      }
      await refreshBranches();
      toast("Window Updated", "Punch scan window saved.", "success");
    } finally {
      setSavingField(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <i className="ri-fingerprint-line text-[#253C7D] dark:text-sky-400" />
            4-Punch Policy &amp; Biometric Scan Windows
          </h4>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
            Configure whether a Business Unit (BU) or site applies 4-punch daily attendance and its time scan windows.
          </p>
        </div>

        <div className="w-full sm:w-64 shrink-0">
          <select
            value={activeTarget?.id || ""}
            onChange={(e) => {
              const newId = e.target.value;
              setSelectedTargetId(newId);
              setSelectedBranchId(newId);
              setLocalTimes({});
            }}
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#253C7D] shadow-2xs cursor-pointer"
          >
            {visibleBranches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.is_site ? `\u00A0\u00A0↳ Site: ${b.name}` : `🏢 BU: ${b.name}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <BiometricPolicyToggleCard
        isFourPunch={isFourPunch}
        toggling={toggling}
        onToggle={handleToggle}
        activeTargetName={activeTarget?.name}
      />

      {isFourPunch ? (
        <ScanWindowsGrid
          getWindowTime={getWindowTime}
          onTimeChange={handleTimeChange}
          onSaveField={handleSaveField}
          savingField={savingField}
        />
      ) : (
        <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-slate-800 text-center space-y-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
            4-Punch Attendance Policy is disabled for {activeTarget?.name}.
          </p>
          <p className="text-[11px] text-gray-400 dark:text-slate-500">
            Toggle the switch above to enable 4-punch daily attendance and configure time scan windows for this Business Unit.
          </p>
        </div>
      )}
    </div>
  );
});
