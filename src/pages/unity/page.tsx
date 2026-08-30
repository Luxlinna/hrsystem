import { useUnityApps } from "./hooks/useUnityApps";
import { UnityStatsCards } from "./components/UnityStatsCards";
import { UnityAppDirectory } from "./components/UnityAppDirectory";
import { UnityActivityFeed } from "./components/UnityActivityFeed";
import { UnityCostBreakdown } from "./components/UnityCostBreakdown";
import AppDetailPanel from "./components/AppDetailPanel";

export default function UnityApps() {
  const {
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
  } = useUnityApps();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Unity Apps</h1>
          <p className="text-[13px] text-gray-500 mt-1">Integrated workplace apps &mdash; manage access, track usage, control costs</p>
        </div>
      </div>

      <UnityStatsCards
        activeApps={activeApps}
        totalUsers={totalUsers}
        todayEvents={todayEvents}
        totalMonthlyCost={totalMonthlyCost}
      />

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit max-w-full overflow-x-auto">
        {[
          { key: "directory", label: "App Directory" },
          { key: "activity", label: "Live Activity" },
          { key: "costs", label: "Cost Breakdown" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === t.key ? "bg-white text-[#253C7D]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "directory" && (
        <UnityAppDirectory
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categories={categories}
          filteredApps={filteredApps}
          getAccessCount={getAccessCount}
          getUsageCount={getUsageCount}
          getTodayMinutes={getTodayMinutes}
          onSelectApp={setSelectedApp}
        />
      )}

      {activeTab === "activity" && (
        <UnityActivityFeed usageLogs={usageLogs} />
      )}

      {activeTab === "costs" && (
        <UnityCostBreakdown apps={apps} totalMonthlyCost={totalMonthlyCost} />
      )}

      {selectedApp && (
        <AppDetailPanel
          app={selectedApp}
          accesses={accesses}
          usageLogs={usageLogs}
          employees={employees}
          onClose={() => setSelectedApp(null)}
          onRefresh={loadAll}
        />
      )}
    </div>
  );
}