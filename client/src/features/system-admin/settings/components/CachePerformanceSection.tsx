import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCacheSettings } from "../hooks/useCacheSettings";

export function CachePerformanceSection() {
  const { user } = useAuth();
  const actorName =
    (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const {
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
  } = useCacheSettings(actorName);

  const [isEditingConnection, setIsEditingConnection] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [inputTls, setInputTls] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latencyMs?: number; error?: string } | null>(null);

  useEffect(() => {
    if (config?.redisUrl) {
      setInputUrl(config.redisUrl);
      setInputTls(config.isTls);
    }
  }, [config]);

  const handleTest = async () => {
    setTestResult(null);
    const result = await testConnection(inputUrl, inputTls);
    setTestResult(result);
  };

  const handleSave = async () => {
    const res = await updateConfig(inputUrl, inputTls);
    if (res.ok) {
      setIsEditingConnection(false);
      setTestResult(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#253C7D] dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const shortProviderName = status.provider.includes("Upstash")
    ? "Upstash (AWS)"
    : status.provider.includes("Embedded")
    ? "Local (Node)"
    : status.provider;

  return (
    <div className="w-full space-y-6">
      {/* ─── Block 1: Master Cache Overview & Status ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
              <i className="ri-flashlight-line text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                  Global Redis Cache
                </h3>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 ${
                    status.connected
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                      : "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      status.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                  {status.connected ? "Connected" : "In-Memory Fallback"}
                </span>
              </div>
            </div>
          </div>

          {/* Master Switch */}
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
              {status.enabled ? "Active" : "Disabled"}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={status.enabled}
              disabled={toggling}
              onClick={() => toggleCache(!status.enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#253C7D] disabled:opacity-50 ${
                status.enabled ? "bg-emerald-600" : "bg-gray-300 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  status.enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* ─── Metrics Block: 4 Proportional Tiles ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
            <p className="text-[11px] font-medium text-gray-400 dark:text-slate-400">Cluster</p>
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100 mt-1">
              {shortProviderName}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
            <p className="text-[11px] font-medium text-gray-400 dark:text-slate-400">Latency</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {status.latencyMs > 0 ? `${status.latencyMs} ms` : "< 2 ms"}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
            <p className="text-[11px] font-medium text-gray-400 dark:text-slate-400">RAM Items</p>
            <p className="text-sm font-bold text-gray-900 dark:text-slate-100 mt-1">
              {status.l1CachedItems}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-slate-800/40 border border-gray-100 dark:border-slate-800">
            <p className="text-[11px] font-medium text-gray-400 dark:text-slate-400">Cluster Sync</p>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              {status.clusterPubSub ? "Active" : "Local"}
            </p>
          </div>
        </div>

        {/* ─── Action Toolbar ─── */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              disabled={clearing}
              onClick={clearCache}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer disabled:opacity-50"
            >
              {clearing ? (
                <div className="w-3.5 h-3.5 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <i className="ri-delete-bin-line text-sm" />
              )}
              <span>Purge Cache</span>
            </button>

            <button
              type="button"
              disabled={benchmarking}
              onClick={runBenchmark}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border border-gray-200/80 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {benchmarking ? (
                <div className="w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <i className="ri-speed-line text-sm" />
              )}
              <span>Run Benchmark</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingConnection(!isEditingConnection)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <i className={isEditingConnection ? "ri-close-line text-sm" : "ri-settings-4-line text-sm"} />
              <span>{isEditingConnection ? "Close Settings" : "Configure Redis"}</span>
            </button>

            <button
              type="button"
              onClick={loadStatus}
              title="Refresh"
              className="p-2 text-xs font-medium text-gray-400 hover:text-gray-700 dark:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Block 2: Connection Configuration (Fits cleanly with Block 1) ─── */}
      {isEditingConnection && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <i className="ri-server-line text-[#253C7D] dark:text-blue-400 text-base" />
              <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 uppercase tracking-wider">
                Connection Settings
              </h4>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setInputUrl("rediss://default:YOUR_PASSWORD@moved-redfish-212207.upstash.io:6379");
                  setInputTls(true);
                }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:border-gray-400 cursor-pointer"
              >
                Upstash
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputUrl("redis://127.0.0.1:6379");
                  setInputTls(false);
                }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:border-gray-400 cursor-pointer"
              >
                Local
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setTestResult(null);
                }}
                placeholder="rediss://default:password@host:6379"
                className="w-full font-mono text-xs px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 cursor-pointer"
              >
                <i className={showPassword ? "ri-eye-off-line text-sm" : "ri-eye-line text-sm"} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={inputTls}
                onChange={(e) => setInputTls(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D]"
              />
              <span className="text-xs text-gray-600 dark:text-slate-300 font-medium">
                Enforce TLS (<code className="font-mono text-[11px]">rediss://</code>)
              </span>
            </label>

            <span className="text-[11px] text-gray-400 dark:text-slate-500 font-mono truncate max-w-[280px]">
              {status.endpoint}
            </span>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                testResult.ok
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                  : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
              }`}
            >
              <i className={testResult.ok ? "ri-checkbox-circle-line text-sm text-emerald-600" : "ri-error-warning-line text-sm text-rose-600"} />
              <span>
                {testResult.ok
                  ? `Connected successfully (${testResult.latencyMs}ms).`
                  : `Failed: ${testResult.error || "Cannot reach host"}`}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              disabled={testingConnection || !inputUrl.trim()}
              onClick={handleTest}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {testingConnection ? (
                <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <i className="ri-radar-line text-xs" />
              )}
              <span>Test</span>
            </button>

            <button
              type="button"
              disabled={savingConfig || !inputUrl.trim()}
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#253C7D] dark:bg-blue-600 text-white hover:bg-[#1e3066] dark:hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {savingConfig ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <i className="ri-save-line text-xs" />
              )}
              <span>Save & Connect</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
