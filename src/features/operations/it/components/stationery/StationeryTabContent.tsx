import React from "react";
import { StationeryStatsRow } from "./StationeryStatsRow";
import { StationeryFilterBar } from "./StationeryFilterBar";
import { StationeryInventoryTable } from "./StationeryInventoryTable";
import { StationeryRequestsTable } from "./StationeryRequestsTable";
import { StationeryItemModal } from "./StationeryItemModal";
import { StationeryRequestModal } from "./StationeryRequestModal";
import { StationeryRestockModal } from "./StationeryRestockModal";
import type { useStationeryData } from "../../hooks/useStationeryData";

interface StationeryTabContentProps {
  stationery: ReturnType<typeof useStationeryData>;
  canManage: boolean;
}

export function StationeryTabContent({ stationery: s, canManage }: StationeryTabContentProps) {
  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <StationeryStatsRow
        totalItemsCount={s.totalItemsCount}
        lowStockCount={s.lowStockCount}
        outOfStockCount={s.outOfStockCount}
        pendingRequestsCount={s.pendingRequestsCount}
        onSelectFilter={(tab, filter) => {
          s.setStationeryTab(tab);
          if (tab === "inventory" && filter) s.setStockStatusFilter(filter);
          if (tab === "requests" && filter) s.setRequestStatusFilter(filter);
        }}
      />

      {/* Filter & Subtab Controls */}
      <StationeryFilterBar
        stationeryTab={s.stationeryTab}
        setStationeryTab={s.setStationeryTab}
        search={s.search}
        setSearch={s.setSearch}
        categoryFilter={s.categoryFilter}
        setCategoryFilter={s.setCategoryFilter}
        stockStatusFilter={s.stockStatusFilter}
        setStockStatusFilter={s.setStockStatusFilter}
        requestStatusFilter={s.requestStatusFilter}
        setRequestStatusFilter={s.setRequestStatusFilter}
        canManage={canManage}
        onOpenNewItem={s.handleOpenNewItem}
        onOpenNewRequest={s.handleOpenNewRequest}
        itemsCount={s.filteredItems.length}
        requestsCount={s.filteredRequests.length}
      />

      {/* Active Table Content */}
      {s.stationeryTab === "inventory" ? (
        <StationeryInventoryTable
          items={s.filteredItems}
          canManage={canManage}
          onEditItem={s.handleOpenEditItem}
          onDeleteItem={s.handleDeleteItem}
          onOpenRestock={s.handleOpenRestock}
          onQuickRequest={(itemId) => s.handleOpenNewRequest(itemId)}
        />
      ) : (
        <StationeryRequestsTable
          requests={s.filteredRequests}
          canManage={canManage}
          onApprove={s.handleApproveRequest}
          onIssue={s.handleIssueRequest}
          onReject={s.handleRejectRequest}
        />
      )}

      {/* Modals */}
      <StationeryItemModal
        isOpen={s.itemModal}
        onClose={() => s.setItemModal(false)}
        form={s.itemForm}
        setForm={s.setItemForm}
        onSave={s.handleSaveItem}
        editingItem={s.editingItem}
      />

      <StationeryRequestModal
        isOpen={s.requestModal}
        onClose={() => s.setRequestModal(false)}
        form={s.requestForm}
        setForm={s.setRequestForm}
        onSubmit={s.handleSubmitRequest}
        items={s.items}
      />

      <StationeryRestockModal
        isOpen={s.restockModal}
        onClose={() => s.setRestockModal(false)}
        targetItem={s.restockTargetItem}
        restockQuantity={s.restockQuantity}
        setRestockQuantity={s.setRestockQuantity}
        onConfirm={s.handleConfirmRestock}
      />
    </div>
  );
}
