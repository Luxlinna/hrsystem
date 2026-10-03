import React, { useState, useMemo } from "react";
import { SiteStatusFilter, SiteFilterStatus } from "./SiteStatusFilter";
import { SiteActionMenu } from "./SiteActionMenu";
import type { WorkSite } from "../../types";

interface SitesTableProps {
  sites: WorkSite[];
  sitesLoading: boolean;
  canManage: boolean;
  onCreateNew: () => void;
  onView: (site: WorkSite) => void;
  onEdit: (site: WorkSite) => void;
  onToggleStatus: (site: WorkSite) => void;
  onDelete: (site: WorkSite) => void;
}

type SortField = "name" | "site_type" | "address";
type SortOrder = "asc" | "desc";

export function SitesTable({
  sites,
  sitesLoading,
  canManage,
  onCreateNew,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: SitesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<SiteFilterStatus>("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedSites = useMemo(() => {
    return sites
      .filter((s) => {
        // Status filter
        if (statusFilter === "active" && s.status === "disabled") return false;
        if (statusFilter === "disabled" && s.status !== "disabled") return false;

        // Search filter
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase().trim();
        const name = (s.name || "").toLowerCase();
        const type = (s.site_type || "").toLowerCase();
        const addr = (s.address || s.description || "").toLowerCase();
        return name.includes(q) || type.includes(q) || addr.includes(q);
      })
      .sort((a, b) => {
        let valA = "";
        let valB = "";
        if (sortField === "name") {
          valA = a.name || "";
          valB = b.name || "";
        } else if (sortField === "site_type") {
          valA = a.site_type || "";
          valB = b.site_type || "";
        } else if (sortField === "address") {
          valA = a.address || a.description || "";
          valB = b.address || b.description || "";
        }
        const cmp = valA.localeCompare(valB);
        return sortOrder === "asc" ? cmp : -cmp;
      });
  }, [sites, searchTerm, statusFilter, sortField, sortOrder]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Top Header matching screenshot */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-normal text-slate-700 dark:text-slate-200">
          Sites
        </h2>
        {canManage && (
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-medium rounded shadow-2xs cursor-pointer transition-colors"
          >
            <i className="ri-add-circle-line text-sm" />
            <span>Create New Site</span>
          </button>
        )}
      </div>

      {/* Filter / Search Bar matching screenshot */}
      <div className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center max-w-sm w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-r-0 border-slate-300 dark:border-slate-700 rounded-l text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="button"
            className="px-3 py-1.5 bg-[#2b8de3] text-white rounded-r flex items-center justify-center hover:bg-[#2272b8] transition-colors cursor-pointer"
            title="Search"
          >
            <i className="ri-search-line text-xs" />
          </button>
        </div>

        {/* Status Filter Dropdown */}
        <SiteStatusFilter status={statusFilter} onChange={setStatusFilter} />
      </div>

      {/* Table matching screenshot */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-700 dark:text-slate-200">
          <thead className="bg-slate-50/70 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 select-none">
            <tr>
              <th className="py-3 px-4 w-16">No.</th>
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-4 cursor-pointer hover:text-[#2b8de3] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Site Name</span>
                  <span className="text-slate-400 text-[10px]">
                    {sortField === "name" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                </div>
              </th>
              <th
                onClick={() => handleSort("site_type")}
                className="py-3 px-4 cursor-pointer hover:text-[#2b8de3] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Site Type</span>
                  <span className="text-slate-400 text-[10px]">
                    {sortField === "site_type" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                </div>
              </th>
              <th
                onClick={() => handleSort("address")}
                className="py-3 px-4 cursor-pointer hover:text-[#2b8de3] transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Address</span>
                  <span className="text-slate-400 text-[10px]">
                    {sortField === "address" ? (sortOrder === "asc" ? "▲" : "▼") : "↕"}
                  </span>
                </div>
              </th>
              <th className="py-3 px-4 w-20 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {sitesLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  <div className="inline-block w-4 h-4 border-2 border-[#2b8de3] border-t-transparent rounded-full animate-spin mb-1" />
                  <div>Loading sites...</div>
                </td>
              </tr>
            ) : filteredAndSortedSites.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                  {searchTerm || statusFilter !== "all"
                    ? "No matching sites found for the selected filter."
                    : "No sites created yet for this Business Unit."}
                </td>
              </tr>
            ) : (
              filteredAndSortedSites.map((site, index) => {
                const isDisabled = site.status === "disabled";
                const displayAddr = site.address || site.description || "—";
                return (
                  <tr
                    key={site.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <span>{site.name}</span>
                          {site.is_default && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-sky-50 text-[#0088cc] rounded border border-sky-200">
                              Default
                            </span>
                          )}
                        </div>
                        {isDisabled && (
                          <span className="inline-block px-1.5 py-0.5 bg-[#f0ad4e] text-white text-[9.5px] font-semibold rounded leading-none shadow-2xs">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      {site.site_type || "Store"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 truncate max-w-md">
                      {displayAddr}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <SiteActionMenu
                        site={site}
                        canManage={canManage}
                        onView={onView}
                        onEdit={onEdit}
                        onToggleStatus={onToggleStatus}
                        onDelete={onDelete}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
