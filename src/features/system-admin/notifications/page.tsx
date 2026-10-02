import { NotificationsHeader } from "./components/NotificationsHeader";
import { NotificationsFilterBar } from "./components/NotificationsFilterBar";
import { NotificationsBulkActionBar } from "./components/NotificationsBulkActionBar";
import { NotificationsGroupList } from "./components/NotificationsGroupList";
import { NotificationsEmptyState } from "./components/NotificationsEmptyState";
import { MobileNotificationsView } from "./components/MobileNotificationsView";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useNotifications } from "./hooks/useNotifications";

export default function Notifications() {
  const {
    loading,
    permLoading,
    realtimeEnabled,
    visibleNotifs,
    unreadCount,
    todayCount,
    urgentCount,
    filter,
    setFilter,
    sourceFilter,
    setSourceFilter,
    search,
    setSearchQuery,
    todayOnly,
    setTodayOnly,
    groups,
    sources,
    filtersActive,
    resetFilters,
    loadNotifications,
    markRead,
    markAllRead,
    markSelectedRead,
    deleteNotification,
    deleteSelected,
    openNotification,
    isNavigable,
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    selectedIds,
    allSelected,
    isIndeterminate,
    selectedCount,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    filtered,
  } = useNotifications();

  if (loading || permLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        <NotificationsHeader
          realtimeEnabled={false}
          unreadCount={0}
          onRefresh={() => {}}
          onMarkAllRead={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Notifications & Alerts"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile View: Clean iOS/Android style matching Mockup (< md) ── */}
      <div className="block md:hidden">
        <MobileNotificationsView
          notifications={filtered}
          unreadCount={unreadCount}
          onRefresh={loadNotifications}
          onMarkAllRead={markAllRead}
          onMarkRead={markRead}
          onDeleteNotification={deleteNotification}
          onOpenNotification={openNotification}
        />
      </div>

      {/* ── Desktop View (>= md) ── */}
      <div className="hidden md:block min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        {/* Header */}
        <NotificationsHeader
          realtimeEnabled={realtimeEnabled}
          unreadCount={unreadCount}
          onRefresh={loadNotifications}
          onMarkAllRead={markAllRead}
        />

        {/* Filters & Search Bar */}
        <NotificationsFilterBar
          search={search}
          setSearch={setSearchQuery}
          filter={filter}
          setFilter={setFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          sources={sources}
          unreadCount={unreadCount}
        />

        {/* Bulk Selection & Action Toolbar (like Recycle Bin) */}
        <NotificationsBulkActionBar
          totalCount={filtered.length}
          selectedCount={selectedCount}
          allSelected={allSelected}
          isIndeterminate={isIndeterminate}
          onToggleSelectAll={toggleSelectAll}
          onClearSelection={clearSelection}
          onMarkSelectedRead={() => {
            markSelectedRead(Array.from(selectedIds));
            clearSelection();
          }}
          onDeleteSelected={() => {
            deleteSelected(Array.from(selectedIds));
            clearSelection();
          }}
        />

        {/* Chronological Notifications List */}
        <NotificationsGroupList
          groups={groups}
          isNavigable={isNavigable}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onOpenNotification={openNotification}
          onMarkRead={markRead}
          onDeleteNotification={deleteNotification}
        />

        {/* Empty State */}
        {groups.length === 0 && (
          <NotificationsEmptyState
            filtersActive={filtersActive}
            onResetFilters={resetFilters}
          />
        )}
      </div>
    </>
  );
}
