import { ITHeader } from "./components/ITHeader";
import { ITTabsBar } from "./components/ITTabsBar";
import { ITStatsRow } from "./components/ITStatsRow";
import { AssetsFilterBar } from "./components/assets/AssetsFilterBar";
import { AssetsTabContent } from "./components/assets/AssetsTabContent";
import { TicketsFilterBar } from "./components/tickets/TicketsFilterBar";
import { TicketsTabContent } from "./components/tickets/TicketsTabContent";
import { TicketDetailDrawer } from "./components/tickets/TicketDetailDrawer";
import { SecurityTabContent } from "./components/security/SecurityTabContent";
import { AssetModal } from "./components/modals/AssetModal";
import { TicketModal } from "./components/modals/TicketModal";
import { useITManagement } from "./hooks/useITManagement";

export default function ITManagement() {
  const {
    canManage,
    isPartnerBranchBlocked,
    userBranchId,
    targetBranch,
    tab,
    setTab,
    assets,
    tickets,
    employees,
    branches,
    loading,
    assetSearch,
    setAssetSearch,
    assetTypeFilter,
    setAssetTypeFilter,
    assetStatusFilter,
    setAssetStatusFilter,
    assetBranchFilter,
    setAssetBranchFilter,
    assetViewMode,
    setAssetViewMode,
    ticketSearch,
    setTicketSearch,
    ticketStatusFilter,
    setTicketStatusFilter,
    ticketPriorityFilter,
    setTicketPriorityFilter,
    ticketCategoryFilter,
    setTicketCategoryFilter,
    activeAssets,
    inInventory,
    openTickets,
    criticalTickets,
    filteredAssets,
    filteredTickets,
    assetTypeStats,
    assetModal,
    setAssetModal,
    editingAsset,
    setEditingAsset,
    savingAsset,
    assetForm,
    setAssetForm,
    handleCreateAsset,
    openEditAsset,
    handleSaveAssetEdit,
    handleDeleteAsset,
    ticketModal,
    setTicketModal,
    selectedTicket,
    setSelectedTicket,
    savingTicket,
    ticketForm,
    setTicketForm,
    handleCreateTicket,
    updateTicketStatus,
    handleDeleteTicket,
  } = useITManagement();

  const activeBranch = branches.find((b) => b.id === (targetBranch || userBranchId));
  const activeBranchName = activeBranch?.name;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <ITHeader
          canManage={false}
          activeAssetsCount={0}
          openTicketsCount={0}
          onOpenAssetModal={() => {}}
          onOpenTicketModal={() => {}}
        />
        <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-800 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 shadow-sm text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 text-3xl">
            <i className="ri-shield-keyhole-line" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Partner Branch IT &amp; Asset Privacy Shield
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
            Hardware asset tags, device serial numbers, network configurations, and IT support incident tickets are strictly confidential to each partner branch. Super Admins and users cannot inspect or manage IT assets of other partner branches.
          </p>
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl text-rose-800 dark:text-rose-300 text-xs font-semibold text-left flex items-start gap-2.5">
            <i className="ri-lock-line text-base shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Access Restricted to Home Branch</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {userBranchId
                  ? `You are assigned to ${activeBranchName || "your home branch"}. Please switch back to your home branch in the header switcher to view IT assets and tickets.`
                  : "You are not assigned to any branch. Please contact your company administrator to assign you to a branch."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <ITHeader
        canManage={canManage}
        branchName={activeBranchName}
        activeAssetsCount={activeAssets}
        openTicketsCount={openTickets}
        onOpenAssetModal={() => {
          setEditingAsset(null);
          setAssetModal(true);
        }}
        onOpenTicketModal={() => setTicketModal(true)}
      />

      {/* Operational Stats Row */}
      <ITStatsRow
        activeAssets={activeAssets}
        inInventory={inInventory}
        openTickets={openTickets}
        criticalTickets={criticalTickets}
        onSelectTab={setTab}
      />

      {/* Navigation Tabs */}
      <ITTabsBar
        activeTab={tab}
        setActiveTab={setTab}
        assetsCount={assets.length}
        openTicketsCount={openTickets}
      />

      {/* Tab 1: Hardware & Asset Register */}
      {tab === "assets" && (
        <>
          <AssetsFilterBar
            assetSearch={assetSearch}
            setAssetSearch={setAssetSearch}
            assetTypeFilter={assetTypeFilter}
            setAssetTypeFilter={setAssetTypeFilter}
            assetStatusFilter={assetStatusFilter}
            setAssetStatusFilter={setAssetStatusFilter}
            assetBranchFilter={assetBranchFilter}
            setAssetBranchFilter={setAssetBranchFilter}
            assetViewMode={assetViewMode}
            setAssetViewMode={setAssetViewMode}
            branches={branches}
          />

          <AssetsTabContent
            assets={filteredAssets}
            assetTypeStats={assetTypeStats}
            totalAssetsCount={assets.length}
            viewMode={assetViewMode}
            canManage={canManage}
            onOpenAssetModal={() => {
              setEditingAsset(null);
              setAssetModal(true);
            }}
            onEditAsset={openEditAsset}
            onDeleteAsset={handleDeleteAsset}
          />
        </>
      )}

      {/* Tab 2: Helpdesk & Incident Queue */}
      {tab === "tickets" && (
        <>
          <TicketsFilterBar
            ticketSearch={ticketSearch}
            setTicketSearch={setTicketSearch}
            ticketStatusFilter={ticketStatusFilter}
            setTicketStatusFilter={setTicketStatusFilter}
            ticketPriorityFilter={ticketPriorityFilter}
            setTicketPriorityFilter={setTicketPriorityFilter}
            ticketCategoryFilter={ticketCategoryFilter}
            setTicketCategoryFilter={setTicketCategoryFilter}
          />

          <TicketsTabContent
            tickets={filteredTickets}
            onSelectTicket={setSelectedTicket}
            onUpdateStatus={updateTicketStatus}
            onDeleteTicket={handleDeleteTicket}
            onOpenTicketModal={() => setTicketModal(true)}
          />
        </>
      )}

      {/* Tab 3: Enterprise Security & Access */}
      {tab === "security" && <SecurityTabContent />}

      {/* Ticket Detail Drawer */}
      <TicketDetailDrawer
        selectedTicket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdateStatus={updateTicketStatus}
        onDeleteTicket={handleDeleteTicket}
      />

      {/* Register / Edit Asset Modal */}
      <AssetModal
        isOpen={assetModal}
        onClose={() => {
          setAssetModal(false);
          setEditingAsset(null);
        }}
        editingAsset={editingAsset}
        assetForm={assetForm}
        setAssetForm={setAssetForm}
        saving={savingAsset}
        employees={employees}
        branches={branches}
        onSubmit={editingAsset ? handleSaveAssetEdit : handleCreateAsset}
      />

      {/* Log Ticket Modal */}
      <TicketModal
        isOpen={ticketModal}
        onClose={() => setTicketModal(false)}
        ticketForm={ticketForm}
        setTicketForm={setTicketForm}
        saving={savingTicket}
        onSubmit={handleCreateTicket}
      />
    </div>
  );
}