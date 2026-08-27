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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <ITHeader
        canManage={canManage}
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