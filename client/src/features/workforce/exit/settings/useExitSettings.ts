import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useExitTypesMutations } from "./useExitTypesMutations";
import { useExitReasonTypesMutations } from "./useExitReasonTypesMutations";
import type { ExitTypeSetting, ExitReasonTypeSetting, ExitSettingTab } from "./types";

export function useExitSettings() {
  const [activeTab, setActiveTab] = useState<ExitSettingTab>("exit-type");
  const [exitTypes, setExitTypes] = useState<ExitTypeSetting[]>([]);
  const [reasonTypes, setReasonTypes] = useState<ExitReasonTypeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [{ data: typesData, error: typesErr }, { data: reasonsData, error: reasonsErr }] =
        await Promise.all([
          supabase
            .from("exit_types")
            .select("*")
            .order("display_order", { ascending: true })
            .order("name", { ascending: true }),
          supabase
            .from("exit_reason_types")
            .select("*")
            .order("display_order", { ascending: true })
            .order("name", { ascending: true }),
        ]);

      if (typesErr) throw typesErr;
      if (reasonsErr) throw reasonsErr;

      setExitTypes(typesData || []);
      setReasonTypes(reasonsData || []);
    } catch (err: any) {
      console.error("Failed to load exit settings:", err);
      toast("Load Failed", "Failed to load exit settings", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const {
    saving: savingType,
    saveExitType,
    toggleExitTypeStatus,
    deleteExitType,
  } = useExitTypesMutations(exitTypes, loadData);

  const {
    saving: savingReason,
    saveReasonType,
    toggleReasonTypeStatus,
    deleteReasonType,
  } = useExitReasonTypesMutations(reasonTypes, loadData);

  const saving = savingType || savingReason;

  const filteredExitTypes = useMemo(() => {
    return exitTypes.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [exitTypes, searchQuery, statusFilter]);

  const filteredReasonTypes = useMemo(() => {
    return reasonTypes.filter((item) => {
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchStatus = statusFilter === "all" || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reasonTypes, searchQuery, statusFilter]);

  return {
    activeTab,
    setActiveTab,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredExitTypes,
    filteredReasonTypes,
    saveExitType,
    toggleExitTypeStatus,
    deleteExitType,
    saveReasonType,
    toggleReasonTypeStatus,
    deleteReasonType,
  };
}
