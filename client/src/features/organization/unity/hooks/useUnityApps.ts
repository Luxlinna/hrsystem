import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { UnityApp, AppAccess, AppUsageLog, Employee } from "../types";

export function useUnityApps() {
  const [apps, setApps] = useState<UnityApp[]>([]);
  const [accesses, setAccesses] = useState<AppAccess[]>([]);
  const [usageLogs, setUsageLogs] = useState<AppUsageLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<UnityApp | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"directory" | "activity" | "costs">("directory");

  const loadAll = useCallback(async () => {
    const [{ data: a }, { data: ac }, { data: ul }, { data: emp }] = await Promise.all([
      supabase.from("unity_apps").select("*").order("name"),
      supabase.from("app_access").select("*, employees(first_name, last_name, role, department, avatar_url)").eq("is_active", true),
      supabase.from("app_usage_logs").select("*, unity_apps(name, icon, color), employees(first_name, last_name, avatar_url)").order("logged_at", { ascending: false }).limit(100),
      supabase.from("employees").select("id, first_name, last_name, role, department, avatar_url").eq("status", "active"),
    ]);
    setApps((a || []) as UnityApp[]);
    setAccesses((ac || []) as AppAccess[]);
    setUsageLogs((ul || []) as AppUsageLog[]);
    setEmployees((emp || []) as Employee[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(apps.map((a) => a.category))).sort()],
    [apps]
  );

  const filteredApps = useMemo(() => {
    return apps.filter((a) => {
      const matchCat = categoryFilter === "All" || a.category === categoryFilter;
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchSearch =
        !searchTerm ||
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchStatus && matchSearch;
    });
  }, [apps, categoryFilter, statusFilter, searchTerm]);

  const getAccessCount = useCallback(
    (appId: number) => accesses.filter((a) => a.app_id === appId).length,
    [accesses]
  );

  const getUsageCount = useCallback(
    (appId: number) => usageLogs.filter((l) => l.app_id === appId).length,
    [usageLogs]
  );

  const getTodayMinutes = useCallback(
    (appId: number) => {
      const today = new Date().toDateString();
      return usageLogs
        .filter((l) => l.app_id === appId && new Date(l.logged_at).toDateString() === today)
        .reduce((s, l) => s + (l.duration_minutes || 0), 0);
    },
    [usageLogs]
  );

  const totalMonthlyCost = useMemo(
    () => apps.reduce((s, a) => s + Number(a.monthly_cost || 0), 0),
    [apps]
  );
  const activeApps = useMemo(() => apps.filter((a) => a.status === "active").length, [apps]);
  const totalUsers = useMemo(() => new Set(accesses.map((a) => a.employee_id)).size, [accesses]);
  const todayEvents = useMemo(
    () => usageLogs.filter((l) => new Date(l.logged_at).toDateString() === new Date().toDateString()).length,
    [usageLogs]
  );

  return {
    apps,
    accesses,
    usageLogs,
    employees,
    loading,
    selectedApp,
    setSelectedApp,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    activeTab,
    setActiveTab,
    categories,
    filteredApps,
    getAccessCount,
    getUsageCount,
    getTodayMinutes,
    totalMonthlyCost,
    activeApps,
    totalUsers,
    todayEvents,
    loadAll,
  };
}
