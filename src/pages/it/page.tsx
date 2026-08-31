import { ITHeader } from "./components/ITHeader";
import { ITTabsBar } from "./components/ITTabsBar";
import { ITStatsRow } from "./components/ITStatsRow";
import { AssetsFilterBar } from "./components/assets/AssetsFilterBar";
import { AssetsTabContent } from "./components/assets/AssetsTabContent";
import { TicketsFilterBar } from "./components/tickets/TicketsFilterBar";
import { TicketsTabContent } from "./components/tickets/TicketsTabContent";
import { TicketDetailDrawer } from "./components/tickets/TicketDetailDrawer";
import { SecurityTabContent } from "./components/security/SecurityTabContent";
import { ITModalsContainer } from "./components/modals/ITModalsContainer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useITManagement } from "./hooks/useITManagement";

export default function ITManagement() {
  const it = useITManagement();

  const activeBranch = it.branches.find((b) => b.id === (it.targetBranch || it.userBranchId));
  const activeBranchName = activeBranch?.name;

  if (it.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (it.isPartnerBranchBlocked) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
        <ITHeader
          canManage={false}
          activeAssetsCount={0}
          openTicketsCount={0}
          onOpenAssetModal={() => {}}
          onOpenTicketModal={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="IT Assets &amp; Helpdesk"
          userBranchName={activeBranchName}
          hasNoBranch={!it.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
      <ITHeader
        canManage={it.canManage}
        branchName={activeBranchName}
        activeAssetsCount={it.activeAssets}
        openTicketsCount={it.openTickets}
        onOpenAssetModal={() => {
          it.setEditingAsset(null);
          it.setAssetModal(true);
        }}
        onOpenTicketModal={() => it.setTicketModal(true)}
        tab={it.tab}
        assets={it.filteredAssets}
        tickets={it.filteredTickets}
      />

      <ITStatsRow
        activeAssets={it.activeAssets}
        inInventory={it.inInventory}
        openTickets={it.openTickets}
        criticalTickets={it.criticalTickets}
        onSelectTab={it.setTab}
      />

      <ITTabsBar
        activeTab={it.tab}
        setActiveTab={it.setTab}
        assetsCount={it.assets.length}
        openTicketsCount={it.openTickets}
      />

      {it.tab === "assets" && (
        <>
          <AssetsFilterBar
            assetSearch={it.assetSearch}
            setAssetSearch={it.setAssetSearch}
            assetTypeFilter={it.assetTypeFilter}
            setAssetTypeFilter={it.setAssetTypeFilter}
            assetStatusFilter={it.assetStatusFilter}
            setAssetStatusFilter={it.setAssetStatusFilter}
            assetBranchFilter={it.assetBranchFilter}
            setAssetBranchFilter={it.setAssetBranchFilter}
            assetViewMode={it.assetViewMode}
            setAssetViewMode={it.setAssetViewMode}
            branches={it.branches}
          />
          <AssetsTabContent
            assets={it.filteredAssets}
            assetTypeStats={it.assetTypeStats}
            totalAssetsCount={it.assets.length}
            viewMode={it.assetViewMode}
            canManage={it.canManage}
            onOpenAssetModal={() => {
              it.setEditingAsset(null);
              it.setAssetModal(true);
            }}
            onEditAsset={it.openEditAsset}
            onDeleteAsset={it.handleDeleteAsset}
          />
        </>
      )}

      {it.tab === "tickets" && (
        <>
          <TicketsFilterBar
            ticketSearch={it.ticketSearch}
            setTicketSearch={it.setTicketSearch}
            ticketStatusFilter={it.ticketStatusFilter}
            setTicketStatusFilter={it.setTicketStatusFilter}
            ticketPriorityFilter={it.ticketPriorityFilter}
            setTicketPriorityFilter={it.setTicketPriorityFilter}
            ticketCategoryFilter={it.ticketCategoryFilter}
            setTicketCategoryFilter={it.setTicketCategoryFilter}
          />
          <TicketsTabContent
            tickets={it.filteredTickets}
            onSelectTicket={it.setSelectedTicket}
            onUpdateStatus={it.updateTicketStatus}
            onDeleteTicket={it.handleDeleteTicket}
            onOpenTicketModal={() => it.setTicketModal(true)}
          />
        </>
      )}

      {it.tab === "security" && <SecurityTabContent />}

      <TicketDetailDrawer
        selectedTicket={it.selectedTicket}
        onClose={() => it.setSelectedTicket(null)}
        onUpdateStatus={it.updateTicketStatus}
        onDeleteTicket={it.handleDeleteTicket}
      />

      <ITModalsContainer
        assetModal={it.assetModal}
        setAssetModal={it.setAssetModal}
        editingAsset={it.editingAsset}
        setEditingAsset={it.setEditingAsset}
        assetForm={it.assetForm}
        setAssetForm={it.setAssetForm}
        savingAsset={it.savingAsset}
        employees={it.employees}
        branches={it.branches}
        handleSaveAssetEdit={it.handleSaveAssetEdit}
        handleCreateAsset={it.handleCreateAsset}
        ticketModal={it.ticketModal}
        setTicketModal={it.setTicketModal}
        ticketForm={it.ticketForm}
        setTicketForm={it.setTicketForm}
        savingTicket={it.savingTicket}
        handleCreateTicket={it.handleCreateTicket}
      />
    </div>
  );
}