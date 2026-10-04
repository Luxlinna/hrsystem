import { useState } from "react";
import { ITHeader } from "./components/ITHeader";
import { ITTabsBar } from "./components/ITTabsBar";
import { AssetsFilterBar } from "./components/assets/AssetsFilterBar";
import { AssetsTabContent } from "./components/assets/AssetsTabContent";
import { AssetInventorySettings } from "./components/settings/AssetInventorySettings";
import { AssetAssignmentsTabContent } from "./components/assignments/AssetAssignmentsTabContent";
import { AssetHistoryTabContent } from "./components/history/AssetHistoryTabContent";
import { TicketsFilterBar } from "./components/tickets/TicketsFilterBar";
import { TicketsTabContent } from "./components/tickets/TicketsTabContent";
import { TicketDetailDrawer } from "./components/tickets/TicketDetailDrawer";
import { SecurityTabContent } from "./components/security/SecurityTabContent";
import { StationeryTabContent } from "./components/stationery/StationeryTabContent";
import { AssetCategoriesTabContent } from "./components/categories/AssetCategoriesTabContent";
import { ITModalsContainer } from "./components/modals/ITModalsContainer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useITManagement } from "./hooks/useITManagement";
import { exportAssetsToCSV, exportAssetsToExcel, exportToJSON } from "./exportUtils";
import { toast } from "@/components/Toast";
import type { ITTabType } from "./types";

export default function ITManagement() {
  const it = useITManagement();
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [assetConditionFilter, setAssetConditionFilter] = useState("all");
  const [dateRangeLabel, setDateRangeLabel] = useState("01/01/2026 - 31/12/2026");

  const activeBranch = it.branches.find((b) => b.id === (it.targetBranch || it.userBranchId));
  const activeBranchName = activeBranch?.name;

  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");

  const IT_TAB_ORDER: ITTabType[] = [
    "categories",
    "assets",
    "assignments",
    "history",
    "settings",
    "tickets",
    "stationery",
    "security",
  ];

  const handleSelectTab = (newTab: ITTabType) => {
    const currentIdx = IT_TAB_ORDER.indexOf(it.tab);
    const targetIdx = IT_TAB_ORDER.indexOf(newTab);
    setSlideDirection(targetIdx >= currentIdx ? "next" : "prev");
    it.setTab(newTab);
  };

  const isAssetModuleTab =
    it.tab === "assets" ||
    it.tab === "categories" ||
    it.tab === "assignments" ||
    it.tab === "history" ||
    it.tab === "settings";

  // Selection handlers
  const handleToggleSelectAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllAssets = () => {
    if (selectedAssetIds.length === it.filteredAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(it.filteredAssets.map((a) => a.id));
    }
  };

  const handleSelectAllAssets = () => {
    setSelectedAssetIds(it.filteredAssets.map((a) => a.id));
  };

  const handleClearAssetSelection = () => {
    setSelectedAssetIds([]);
  };

  const handleBulkDeleteAssets = async () => {
    if (selectedAssetIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedAssetIds.length} selected asset(s)?`)) return;

    for (const id of selectedAssetIds) {
      const asset = it.assets.find((a) => a.id === id);
      if (asset) {
        await it.handleDeleteAsset(asset);
      }
    }
    setSelectedAssetIds([]);
    toast("Bulk Delete Completed", `Successfully removed selected assets.`, "success");
  };

  const handleExportAssets = (format: "csv" | "excel" | "json") => {
    const dataToExport =
      selectedAssetIds.length > 0
        ? it.assets.filter((a) => selectedAssetIds.includes(a.id))
        : it.filteredAssets;

    if (format === "csv") {
      exportAssetsToCSV(dataToExport);
      toast("Export Started", "Downloading assets CSV file...", "info");
    } else if (format === "excel") {
      exportAssetsToExcel(dataToExport);
      toast("Export Started", "Downloading assets Excel spreadsheet...", "info");
    } else {
      exportToJSON(dataToExport, "asset_inventory");
      toast("Export Started", "Downloading assets JSON file...", "info");
    }
  };

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
          onOpenAssetModal={() => {}}
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-4">
      {!isAssetModuleTab && (
        <ITHeader
          canManage={it.canManage}
          onOpenAssetModal={() => {
            it.setEditingAsset(null);
            it.setAssetModal(true);
          }}
          onOpenSettings={() => handleSelectTab("settings")}
          tab={it.tab}
        />
      )}

      {it.tab === "assets" && (
        <ITHeader
          canManage={it.canManage}
          onOpenAssetModal={() => {
            it.setEditingAsset(null);
            it.setAssetModal(true);
          }}
          onOpenSettings={() => handleSelectTab("settings")}
          tab={it.tab}
        />
      )}

      {!isAssetModuleTab && (
        <ITTabsBar
          activeTab={it.tab}
          setActiveTab={handleSelectTab}
          assetsCount={it.assets.length}
          openTicketsCount={it.openTickets}
          stationeryItemsCount={it.stationery.items.length}
          pendingRequestsCount={it.stationery.pendingRequestsCount}
        />
      )}

      {/* Slide Presentation Transition Container */}
      <div
        key={it.tab}
        className={`w-full ${
          slideDirection === "next" ? "animate-cover-next" : "animate-cover-prev"
        }`}
      >
        {it.tab === "settings" && (
          <AssetInventorySettings
            onBack={() => handleSelectTab("assets")}
            canManage={it.canManage}
          />
        )}

        {it.tab === "assets" && (
          <>
            <AssetsFilterBar
              assetSearch={it.assetSearch}
              setAssetSearch={it.setAssetSearch}
              assetTypeFilter={it.assetTypeFilter}
              setAssetTypeFilter={it.setAssetTypeFilter}
              assetStatusFilter={it.assetStatusFilter}
              setAssetStatusFilter={it.setAssetStatusFilter}
              assetConditionFilter={assetConditionFilter}
              setAssetConditionFilter={setAssetConditionFilter}
              assetBranchFilter={it.assetBranchFilter}
              setAssetBranchFilter={it.setAssetBranchFilter}
              dateRangeLabel={dateRangeLabel}
              setDateRangeLabel={setDateRangeLabel}
              assetViewMode={it.assetViewMode}
              setAssetViewMode={it.setAssetViewMode}
              branches={it.branches}
              selectedAssetIds={selectedAssetIds}
              onSelectAll={handleSelectAllAssets}
              onClearSelection={handleClearAssetSelection}
              onBulkDelete={handleBulkDeleteAssets}
              onExport={handleExportAssets}
              onImport={() => {
                it.setEditingAsset(null);
                it.setAssetModal(true);
              }}
              onSelectTab={handleSelectTab}
            />
            <AssetsTabContent
              assets={it.filteredAssets.filter((a) =>
                assetConditionFilter === "all" ? true : a.condition === assetConditionFilter
              )}
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
              selectedAssetIds={selectedAssetIds}
              onToggleSelect={handleToggleSelectAsset}
              onToggleSelectAll={handleToggleSelectAllAssets}
            />
          </>
        )}

        {it.tab === "categories" && (
          <AssetCategoriesTabContent
            assets={it.assets}
            canManage={it.canManage}
            onSelectTab={handleSelectTab}
            onSelectCategory={(categoryName) => {
              it.setAssetSearch(categoryName.split(":")[0] || categoryName);
              handleSelectTab("assets");
            }}
            onOpenAssetModalForCategory={(categoryName) => {
              it.setEditingAsset(null);
              it.setAssetForm((prev) => ({
                ...prev,
                category: categoryName,
                type: categoryName.includes("Laptop") ? "Laptop" :
                  categoryName.includes("Desktop") ? "Display" :
                  categoryName.includes("Phone") || categoryName.includes("Contact") ? "Mobile" : "Other",
              }));
              it.setAssetModal(true);
            }}
          />
        )}

        {it.tab === "assignments" && (
          <AssetAssignmentsTabContent
            assets={it.assets}
            canManage={it.canManage}
            onSelectTab={handleSelectTab}
            onUpdateAsset={(updated) => {
              it.setEditingAsset(updated);
            }}
          />
        )}

        {it.tab === "history" && (
          <AssetHistoryTabContent
            assets={it.assets}
            onSelectTab={handleSelectTab}
          />
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

        {it.tab === "stationery" && (
          <StationeryTabContent
            stationery={it.stationery}
            canManage={it.canManage}
          />
        )}

        {it.tab === "security" && <SecurityTabContent />}
      </div>

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
        activeBranchId={it.targetBranch || it.userBranchId || activeBranch?.id || null}
        activeBranchName={activeBranchName || null}
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