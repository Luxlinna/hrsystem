import React from "react";
import { STATIONERY_CATEGORIES } from "../../constants";

interface StationeryFilterBarProps {
  stationeryTab: "inventory" | "requests";
  setStationeryTab: (tab: "inventory" | "requests") => void;
  search: string;
  setSearch: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  stockStatusFilter: "all" | "in_stock" | "low_stock" | "out_of_stock";
  setStockStatusFilter: (st: "all" | "in_stock" | "low_stock" | "out_of_stock") => void;
  requestStatusFilter: "all" | "pending" | "approved" | "issued" | "rejected";
  setRequestStatusFilter: (st: "all" | "pending" | "approved" | "issued" | "rejected") => void;
  canManage: boolean;
  onOpenNewItem: () => void;
  onOpenNewRequest: () => void;
  itemsCount: number;
  requestsCount: number;
}

export function StationeryFilterBar({
  stationeryTab,
  setStationeryTab,
  search,
  setSearch,
  categoryFilter,
  setCategoryFilter,
  stockStatusFilter,
  setStockStatusFilter,
  requestStatusFilter,
  setRequestStatusFilter,
  canManage,
  onOpenNewItem,
  onOpenNewRequest,
  itemsCount,
  requestsCount,
}: StationeryFilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Sub-tab pills & Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setStationeryTab("inventory")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stationeryTab === "inventory"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-stack-line text-sm" />
            <span>Inventory Stock</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 font-bold">
              {itemsCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStationeryTab("requests")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              stationeryTab === "requests"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-hand-coin-line text-sm" />
            <span>Supply Requisitions</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600 font-bold">
              {requestsCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenNewRequest()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#253C7D]/10 text-[#253C7D] hover:bg-[#253C7D]/20 transition-all cursor-pointer"
          >
            <i className="ri-hand-coin-line text-sm" />
            <span>Request Supplies</span>
          </button>
          {canManage && (
            <button
              type="button"
              onClick={onOpenNewItem}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#253C7D] text-white hover:bg-[#1f3268] shadow-2xs transition-all cursor-pointer"
            >
              <i className="ri-add-line text-base font-bold" />
              <span>Add Supply Item</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Dropdowns */}
      <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              stationeryTab === "inventory"
                ? "Search supply name, SKU, or storage location..."
                : "Search requester, item name, or department..."
            }
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] focus:border-[#253C7D]"
          />
        </div>

        {stationeryTab === "inventory" ? (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {STATIONERY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock Alerts</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={requestStatusFilter}
              onChange={(e) => setRequestStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
            >
              <option value="all">All Requisition Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="issued">Issued</option>
              <option value="rejected">Declined</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
