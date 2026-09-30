import React, { useState, useMemo } from "react";
import type { ITAsset, ITTabType } from "../../types";
import { AssetNavDropdown } from "../navigation/AssetNavDropdown";
import { toast } from "@/components/Toast";

interface AssetAssignmentsTabContentProps {
  assets: ITAsset[];
  canManage?: boolean;
  onSelectTab: (tab: ITTabType) => void;
  onUpdateAsset?: (asset: ITAsset) => void;
}

export const AssetAssignmentsTabContent: React.FC<AssetAssignmentsTabContentProps> = ({
  assets,
  canManage = true,
  onSelectTab,
  onUpdateAsset,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Assigned" | "Returned">("All");

  // Track assigned assets
  const assignmentsList = useMemo(() => {
    return assets.map((a, idx) => ({
      id: a.id,
      assetName: a.name,
      assetTag: a.asset_tag,
      type: a.type || a.category || "General",
      assignedTo: a.employees
        ? `${a.employees.first_name} ${a.employees.last_name}`
        : a.employee_id
        ? "Assigned User"
        : null,
      department: a.employees?.department || "General",
      assignedDate: a.purchase_date || "2026-01-15",
      returnDate: a.status === "inventory" ? "2026-02-01" : null,
      condition: a.condition || "Good",
      status: a.status === "active" || a.employee_id ? "Assigned" : "Returned",
      rawAsset: a,
      no: idx + 1,
    }));
  }, [assets]);

  const filteredAssignments = useMemo(() => {
    return assignmentsList.filter((item) => {
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          item.assetName.toLowerCase().includes(q) ||
          item.assetTag.toLowerCase().includes(q) ||
          (item.assignedTo && item.assignedTo.toLowerCase().includes(q)) ||
          item.department.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [assignmentsList, searchQuery, statusFilter]);

  const handleReturnAsset = (item: (typeof assignmentsList)[0]) => {
    if (!canManage) return;
    if (window.confirm(`Mark ${item.assetName} as returned to inventory?`)) {
      if (onUpdateAsset) {
        onUpdateAsset({
          ...item.rawAsset,
          employee_id: null,
          status: "inventory",
        });
      }
      toast("Asset Returned", `${item.assetName} returned to stock.`, "success");
    }
  };

  return (
    <div className="space-y-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-normal text-slate-700 tracking-tight">Assignment and Return</h1>
      </div>

      {/* Asset Navigation Trigger on left */}
      <div className="flex items-center gap-4">
        <AssetNavDropdown currentTab="assignments" onSelectTab={onSelectTab} />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-transparent">
        {/* Search */}
        <div className="flex items-center rounded-sm border border-slate-300 focus-within:border-[#253C7D] bg-white overflow-hidden shadow-2xs max-w-xs w-full transition-colors h-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assignments..."
            className="flex-1 px-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <i className="ri-close-line text-xs" />
            </button>
          )}
          <div className="bg-[#253C7D] text-white px-3 h-full flex items-center justify-center">
            <i className="ri-search-line text-xs" />
          </div>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-2">
          {(["All", "Assigned", "Returned"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                statusFilter === st
                  ? "bg-[#253C7D] text-white border-[#253C7D]"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Assignments Table */}
      <div className="overflow-x-auto bg-white border border-slate-200/80 rounded-sm shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-700">
              <th className="px-4 py-3 w-14">No.</th>
              <th className="px-4 py-3">Asset</th>
              <th className="px-4 py-3">Tag #</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Assigned Date</th>
              <th className="px-4 py-3">Condition</th>
              <th className="px-4 py-3">Status</th>
              {canManage && <th className="px-4 py-3 text-right">Action</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 9 : 8}
                  className="py-6 px-4 text-center bg-[#f4f6f9] border-t border-slate-200 text-xs font-bold text-slate-700"
                >
                  No records found
                </td>
              </tr>
            ) : (
              filteredAssignments.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 text-slate-600 font-medium">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.assetName}</td>
                  <td className="px-4 py-3 text-slate-600">{item.assetTag}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium">{item.assignedTo || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{item.department}</td>
                  <td className="px-4 py-3 text-slate-600">{item.assignedDate}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                      {item.condition}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        item.status === "Assigned"
                          ? "bg-[#253C7D]/10 text-[#253C7D] border-[#253C7D]/20"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      {item.status === "Assigned" ? (
                        <button
                          type="button"
                          onClick={() => handleReturnAsset(item)}
                          className="px-2.5 py-1 text-xs text-[#253C7D] hover:bg-[#253C7D]/10 rounded font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <i className="ri-arrow-go-back-line text-xs" />
                          <span>Return</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
