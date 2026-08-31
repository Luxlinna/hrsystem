import { useAnnouncements } from "./hooks/useAnnouncements";
import { AnnouncementHeader } from "./components/AnnouncementHeader";
import { MetricCards } from "./components/MetricCards";
import { FilterBar } from "./components/FilterBar";
import { AnnouncementCardsView } from "./components/AnnouncementCardsView";
import { AnnouncementTableView } from "./components/AnnouncementTableView";
import { Pagination } from "./components/Pagination";
import { AnnouncementDrawer } from "./components/AnnouncementDrawer";
import { AnnouncementComposerModal } from "./components/AnnouncementComposerModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

export default function Announcements() {
  const {
    canManage, isSuperAdmin, userBranchName, userBranchId,
    selectedId, setSelectedId, selectedItem,
    showCreateModal, setShowCreateModal, editingId, setEditingId,
    composerMode, setComposerMode, form, setForm,
    data, mutations, filters, openCreateModal, openEditModal, handleFormSubmit,
  } = useAnnouncements();

  if (data.loading && data.announcements.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading company announcements...</p>
      </div>
    );
  }

  if (data.isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <AnnouncementHeader publishedCount={0} canManage={false} onExportCSV={() => {}} onOpenCreateModal={() => {}} />
        <PartnerBranchPrivacyShield moduleName="Announcements & Bulletins" userBranchName={userBranchName} hasNoBranch={!userBranchId} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      <AnnouncementHeader
        publishedCount={data.announcements.length}
        canManage={canManage}
        onOpenCreateModal={openCreateModal}
        announcements={filters.filtered}
      />

      <MetricCards
        activeCount={data.activeCount}
        urgentCount={data.urgentCount}
        pinnedCount={data.pinnedCount}
        totalViews={data.totalViews}
        mainTab={filters.mainTab}
        onSelectTab={(t) => { filters.setMainTab(t); filters.setPage(1); }}
      />

      <FilterBar
        announcements={data.announcements}
        mainTab={filters.mainTab}
        setMainTab={filters.setMainTab}
        urgentCount={data.urgentCount}
        pinnedCount={data.pinnedCount}
        searchTerm={filters.searchTerm}
        setSearchTerm={filters.setSearchTerm}
        filterCat={filters.filterCat}
        setFilterCat={filters.setFilterCat}
        filterPriority={filters.filterPriority}
        setFilterPriority={filters.setFilterPriority}
        filterAudience={filters.filterAudience}
        setFilterAudience={filters.setFilterAudience}
        viewMode={filters.viewMode}
        setViewMode={filters.setViewMode}
        onFilterChange={() => filters.setPage(1)}
      />

      {filters.filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-newspaper-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Announcements Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No announcements match your selected tab, category filter, priority, or search term.
          </p>
          {canManage && (
            <button type="button" onClick={openCreateModal} className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer">
              + Post New Announcement
            </button>
          )}
        </div>
      ) : filters.viewMode === "cards" ? (
        <AnnouncementCardsView
          announcements={filters.pagedAnnouncements}
          selectedId={selectedId}
          canManage={canManage}
          mustAcceptUrgentAnnouncements={data.mustAcceptUrgentAnnouncements}
          acceptedUrgentIds={data.acceptedUrgentIds}
          timeAgo={filters.timeAgo}
          onOpen={mutations.openAnnouncement}
          onTogglePin={mutations.handleTogglePin}
          onCopyLink={filters.handleCopyLink}
        />
      ) : (
        <AnnouncementTableView
          announcements={filters.pagedAnnouncements}
          canManage={canManage}
          timeAgo={filters.timeAgo}
          onOpen={mutations.openAnnouncement}
          onCopyLink={filters.handleCopyLink}
          onOpenEditModal={openEditModal}
          onDeleteAnnouncement={mutations.deleteAnnouncement}
        />
      )}

      <Pagination
        totalCount={filters.filtered.length}
        pageSize={filters.pageSize}
        setPageSize={filters.setPageSize}
        page={filters.page}
        setPage={filters.setPage}
        totalPages={filters.totalPages}
      />

      <AnnouncementDrawer
        selectedItem={selectedItem}
        onClose={() => setSelectedId(null)}
        canManage={canManage}
        mustAcceptUrgentAnnouncements={data.mustAcceptUrgentAnnouncements}
        acceptedUrgentIds={data.acceptedUrgentIds}
        acceptingUrgent={mutations.acceptingUrgent}
        acceptUrgentError={mutations.acceptUrgentError}
        timeAgo={filters.timeAgo}
        onAcceptUrgent={mutations.acceptUrgentAnnouncement}
        onTogglePin={mutations.handleTogglePin}
        onCopyLink={filters.handleCopyLink}
        onOpenEditModal={openEditModal}
        onDeleteAnnouncement={mutations.deleteAnnouncement}
      />

      <AnnouncementComposerModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingId(null); }}
        editingId={editingId}
        form={form}
        setForm={setForm}
        submitting={mutations.submitting}
        composerMode={composerMode}
        setComposerMode={setComposerMode}
        onSubmit={handleFormSubmit}
        isSuperAdmin={isSuperAdmin}
        userBranchName={userBranchName}
        userBranchId={userBranchId}
      />
    </div>
  );
}
