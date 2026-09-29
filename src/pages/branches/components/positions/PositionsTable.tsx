import { useState, useMemo } from "react";
import { PositionActionMenu } from "./PositionActionMenu";
import { PositionStatusFilter } from "./PositionStatusFilter";
import { PositionTaxFilter } from "./PositionTaxFilter";
import type { Position } from "../../types";

interface PositionsTableProps {
  positions: Position[];
  loading: boolean;
  canManage?: boolean;
  onCreateNew: () => void;
  onView: (pos: Position) => void;
  onEdit: (pos: Position) => void;
  onToggleStatus: (pos: Position) => void;
  onDelete: (pos: Position) => void;
}

type SortField = "name" | "tax_position" | "sort_order";
type SortDirection = "asc" | "desc";

export function PositionsTable({
  positions,
  loading,
  canManage = true,
  onCreateNew,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: PositionsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [taxFilter, setTaxFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("sort_order");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...positions];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((p) => (p.status || "active") === statusFilter);
    }

    // Tax Position filter
    if (taxFilter !== "all") {
      result = result.filter((p) => p.tax_position === taxFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.tax_position?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortField === "name") {
        valA = a.name || "";
        valB = b.name || "";
      } else if (sortField === "tax_position") {
        valA = a.tax_position || "";
        valB = b.tax_position || "";
      } else if (sortField === "sort_order") {
        valA = a.sort_order ?? 0;
        valB = b.sort_order ?? 0;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return result;
  }, [positions, search, statusFilter, taxFilter, sortField, sortDirection]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredAndSorted.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allSelected =
    filteredAndSorted.length > 0 && selectedIds.size === filteredAndSorted.length;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Top Bar with Title and Create Button */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Positions
        </h2>
        {canManage && (
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors"
          >
            <i className="ri-add-circle-line text-sm" />
            <span>Create New Position</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search input with blue magnifying glass icon */}
        <div className="relative flex items-center max-w-sm w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-3 pr-10 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-l text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
          />
          <button
            type="button"
            className="px-3 py-1.5 bg-[#2b8de3] text-white rounded-r border border-[#2b8de3] flex items-center justify-center cursor-pointer hover:bg-[#2272b8] transition-colors"
          >
            <i className="ri-search-line text-xs" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <PositionStatusFilter
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
          <PositionTaxFilter
            taxFilter={taxFilter}
            setTaxFilter={setTaxFilter}
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold bg-slate-50/50 dark:bg-slate-900/50">
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#2b8de3] focus:ring-[#2b8de3] cursor-pointer"
                />
              </th>
              <th className="py-3 px-4 w-16">No.</th>
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-6 cursor-pointer select-none hover:text-[#2b8de3] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Position Name</span>
                  <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
                </div>
              </th>
              <th
                onClick={() => handleSort("tax_position")}
                className="py-3 px-6 cursor-pointer select-none hover:text-[#2b8de3] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tax Position</span>
                  <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
                </div>
              </th>
              <th className="py-3 px-6 text-right w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#2b8de3] border-t-transparent rounded-full animate-spin" />
                    <span>Loading positions...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No positions found.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((pos, index) => {
                const isDisabled = pos.status === "disabled";
                const isSelected = selectedIds.has(pos.id);
                return (
                  <tr
                    key={pos.id || index}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                      isSelected ? "bg-blue-50/40 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(pos.id)}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-[#2b8de3] focus:ring-[#2b8de3] cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4 font-normal text-slate-600 dark:text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3 px-6">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {pos.name}
                        </span>
                        {isDisabled && (
                          <span className="inline-block px-1.5 py-0.5 bg-[#f0ad4e] text-white text-[9.5px] font-semibold rounded leading-none shadow-2xs">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-slate-600 dark:text-slate-300">
                      {pos.tax_position || "—"}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {canManage && (
                        <PositionActionMenu
                          position={pos}
                          onView={onView}
                          onEdit={onEdit}
                          onToggleStatus={onToggleStatus}
                          onDelete={onDelete}
                        />
                      )}
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
