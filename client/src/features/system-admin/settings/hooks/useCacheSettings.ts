import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";

export interface CacheStatus {
  enabled: boolean;
  connected: boolean;
  provider: string;
  latencyMs: number;
  l1CachedItems: number;
  clusterPubSub: boolean;
  endpoint: string;
}

export interface RedisConnectionConfig {
  redisUrl: string;
  isTls: boolean;
  isCustom: boolean;
}

export function useCacheSettings(actorName: string) {
  const [status, setStatus] = useState<CacheStatus>({
    enabled: true,
    connected: false,
    provider: "Upstash Serverless Redis (AWS)",
    latencyMs: 0,
    l1CachedItems: 0,
    clusterPubSub: true,
    endpoint: "Upstash Cloud",
  });

  const [config, setConfig] = useState<RedisConnectionConfig>({
    redisUrl: "",
    isTls: true,
    isCustom: false,
  });

  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [benchmarking, setBenchmarking] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const getAuthHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }, []);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      const [statusRes, configRes] = await Promise.all([
        fetch("/api/settings/cache/status", {
          headers: { "Content-Type": "application/json", ...authHeader },
        }),
        fetch("/api/settings/cache/config", {
          headers: { "Content-Type": "application/json", ...authHeader },
        }),
      ]);

      const statusJson = await statusRes.json();
      if (statusJson.ok && statusJson.data) {
        setStatus(statusJson.data);
      }

      const configJson = await configRes.json();
      if (configJson.ok && configJson.data) {
        setConfig(configJson.data);
      }
    } catch (err: any) {
      console.warn("Failed to load cache status/config:", err?.message || err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const toggleCache = useCallback(
    async (nextEnabled: boolean) => {
      setToggling(true);
      try {
        const authHeader = await getAuthHeader();
        const res = await fetch("/api/settings/cache/toggle", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({ enabled: nextEnabled }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to update cache setting");

        setStatus((prev) => ({ ...prev, enabled: nextEnabled }));
        toast(
          "Cache Updated",
          `Global Redis caching has been ${nextEnabled ? "enabled" : "disabled"} across all servers.`,
          "success"
        );

        logActivity({
          module: "settings",
          action: "updated",
          entityType: "system_setting",
          entityId: null,
          actorName,
          actorRole: "admin",
          description: `Global Redis caching ${nextEnabled ? "enabled" : "disabled"}`,
        });
      } catch (err: any) {
        toast("Error", err?.message || "Failed to toggle cache.", "error");
      } finally {
        setToggling(false);
      }
    },
    [getAuthHeader, actorName]
  );

  const clearCache = useCallback(async () => {
    setClearing(true);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch("/api/settings/cache/clear", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to clear cache");

      setStatus((prev) => ({ ...prev, l1CachedItems: 0 }));
      toast(
        "Cache Purged",
        "Global Redis & In-Memory caches purged successfully across all cluster nodes.",
        "success"
      );

      logActivity({
        module: "settings",
        action: "deleted",
        entityType: "cache",
        entityId: null,
        actorName,
        actorRole: "admin",
        description: "Global Redis & Node cache purged by administrator",
      });
    } catch (err: any) {
      toast("Error", err?.message || "Failed to clear cache.", "error");
    } finally {
      setClearing(false);
    }
  }, [getAuthHeader, actorName]);

  const runBenchmark = useCallback(async () => {
    setBenchmarking(true);
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch("/api/settings/cache/benchmark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Benchmark failed");

      setStatus((prev) => ({ ...prev, latencyMs: json.latencyMs }));
      toast(
        "Benchmark Complete",
        `Live roundtrip to Cloud Redis: ${json.latencyMs}ms`,
        "success"
      );
    } catch (err: any) {
      toast("Benchmark Failed", err?.message || "Could not ping Redis.", "error");
    } finally {
      setBenchmarking(false);
    }
  }, [getAuthHeader]);

  const testConnection = useCallback(
    async (targetUrl: string, isTls: boolean) => {
      setTestingConnection(true);
      try {
        const authHeader = await getAuthHeader();
        const res = await fetch("/api/settings/cache/test-connection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({ redisUrl: targetUrl, isTls }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Connection failed");

        toast(
          "Connection Verified",
          `Success! Ping latency: ${json.latencyMs}ms. Ready to save.`,
          "success"
        );
        return { ok: true, latencyMs: json.latencyMs };
      } catch (err: any) {
        toast("Connection Failed", err?.message || "Could not connect to Redis.", "error");
        return { ok: false, error: err?.message };
      } finally {
        setTestingConnection(false);
      }
    },
    [getAuthHeader]
  );

  const updateConfig = useCallback(
    async (newUrl: string, isTls: boolean) => {
      setSavingConfig(true);
      try {
        const authHeader = await getAuthHeader();
        const res = await fetch("/api/settings/cache/update-config", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeader,
          },
          body: JSON.stringify({ redisUrl: newUrl, isTls }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to update configuration");

        setConfig({ redisUrl: newUrl, isTls, isCustom: true });
        toast("Redis Reconnected", json.message || "Configuration saved and active.", "success");

        logActivity({
          module: "settings",
          action: "updated",
          entityType: "system_setting",
          entityId: null,
          actorName,
          actorRole: "admin",
          description: "Redis connection configuration updated live",
        });

        await loadStatus();
        return { ok: true };
      } catch (err: any) {
        toast("Update Failed", err?.message || "Could not save Redis settings.", "error");
        return { ok: false, error: err?.message };
      } finally {
        setSavingConfig(false);
      }
    },
    [getAuthHeader, actorName, loadStatus]
  );

  return {
    status,
    config,
    loading,
    toggling,
    clearing,
    benchmarking,
    testingConnection,
    savingConfig,
    loadStatus,
    toggleCache,
    clearCache,
    runBenchmark,
    testConnection,
    updateConfig,
  };
}
