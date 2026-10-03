import { useState, useMemo } from "react";
import { PositionActionMenu } from "./PositionActionMenu";
import { ImportPositionsModal } from "./ImportPositionsModal";
import { downloadXlsx, utils } from "@/lib/xlsx";
import { toast } from "@/components/Toast";
import type { Position } from "../../types";

interface Props {
  positions: Position[];
  loading: boolean;
  canManage?: boolean;
  onCreateNew: () => void;
  onView: (pos: Position) => void;
  onEdit: (pos: Position) => void;
  onToggleStatus: (pos: Position) => void;
  onDelete: (pos: Position) => void;
  onBulkDelete?: (ids: string[]) => void;
  onImport?: (items: Array<{ name: string; status?: string; sort_order?: number }>) => Promise<boolean>;
}

export function PositionsTable({
  positions,
  loading,
  canManage = true,
  onCreateNew,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  onBulkDelete,
  onImport,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [sortField, setSortField] = useState<"name" | "sort_order">("sort_order");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleExport = () => {
    if (!positions.length) return toast("No positions to export", "info");
    const data = positions.map((p, i) => ({ "No.": i + 1, "Position Name": p.name, "Status": p.status || "active" }));
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Positions");
    downloadXlsx(wb, "positions_list.xlsx");
    toast("Positions exported", "success");
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const filtered = useMemo(() => {
    return positions
      .filter((p) => (statusFilter === "all" || (p.status || "active") === statusFilter))
      .filter((p) => (!search.trim() || p.name?.toLowerCase().includes(search.toLowerCase())))
      .sort((a, b) => {
        const vA = sortField === "name" ? (a.name || "") : (a.sort_order ?? 0);
        const vB = sortField === "name" ? (b.name || "") : (b.sort_order ?? 0);
        return sortAsc ? (typeof vA === "number" ? vA - (vB as number) : String(vA).localeCompare(String(vB))) : (typeof vA === "number" ? (vB as number) - vA : String(vB).localeCompare(String(vA)));
      });
  }, [positions, search, statusFilter, sortField, sortAsc]);

  const allSelected = filtered.length > 0 && selectedIds.size === filtered.length;
  const filterPills = [
    { key: "all" as const, label: "All", count: positions.length },
    { key: "active" as const, label: "Active", count: positions.filter((p) => (p.status || "active") === "active").length },
    { key: "disabled" as const, label: "Disabled", count: positions.filter((p) => p.status === "disabled").length },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Top Header & Actions */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Positions</h2>
        {canManage && (
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && onBulkDelete && (
              <button type="button" onClick={() => { onBulkDelete(Array.from(selectedIds)); setSelectedIds(new Set()); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors active:scale-95">
                <i className="ri-delete-bin-line text-xs" /><span>Delete ({selectedIds.size})</span>
              </button>
            )}
            <button type="button" onClick={handleExport} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 shadow-2xs cursor-pointer hover:bg-slate-50">
              <i className="ri-download-2-line text-xs" /><span>Export</span>
            </button>
            {onImport && (
              <button type="button" onClick={() => setIsImportOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 text-[#2b8de3] text-xs font-semibold rounded border border-[#2b8de3]/40 shadow-2xs cursor-pointer hover:bg-slate-50">
                <i className="ri-file-upload-line text-xs" /><span>Import Positions</span>
              </button>
            )}
            <button type="button" onClick={onCreateNew} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-semibold rounded shadow-2xs cursor-pointer">
              <i className="ri-add-circle-line text-sm" /><span>Create New Position</span>
            </button>
          </div>
        )}
      </div>

      {/* Notifications-styled Search & Filter Bar */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0 max-w-xs sm:max-w-sm">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search positions..." className="w-full pl-8 pr-7 py-1.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:border-[#253C7D] dark:focus:border-[#2b8de3] transition-colors" />
          {search && <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"><i className="ri-close-line text-xs" /></button>}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filterPills.map((f) => {
            const isSelected = statusFilter === f.key;
            return (
              <button key={f.key} type="button" onClick={() => setStatusFilter(f.key)} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${isSelected ? "bg-[#253C7D] text-white shadow-2xs" : "bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700"}`}>
                <span>{f.label}</span>
                {f.count > 0 && <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300"}`}>{f.count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold bg-slate-50/50 dark:bg-slate-900/50">
              <th className="py-3 px-4 w-10 text-center"><input type="checkbox" checked={allSelected} onChange={(e) => setSelectedIds(e.target.checked ? new Set(filtered.map((p) => p.id)) : new Set())} className="w-3.5 h-3.5 rounded border-slate-300 text-[#2b8de3] cursor-pointer" /></th>
              <th className="py-3 px-4 w-16">No.</th>
              <th onClick={() => handleSort("name")} className="py-3 px-6 cursor-pointer select-none hover:text-[#2b8de3]"><div className="flex items-center gap-1.5"><span>Position Name</span><i className="ri-arrow-up-down-line text-slate-400 text-xs" /></div></th>
              <th className="py-3 px-6 text-right w-24" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
            {loading ? (
              <tr><td colSpan={4} className="py-12 text-center text-slate-400"><div className="w-4 h-4 border-2 border-[#2b8de3] border-t-transparent rounded-full animate-spin inline-block mr-2" />Loading positions...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-12 text-center text-slate-400">No positions found.</td></tr>
            ) : (
              filtered.map((pos, index) => {
                const isSelected = selectedIds.has(pos.id);
                return (
                  <tr key={pos.id || index} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isSelected ? "bg-blue-50/40" : ""}`}>
                    <td className="py-3 px-4 text-center"><input type="checkbox" checked={isSelected} onChange={() => setSelectedIds((prev) => { const n = new Set(prev); if (n.has(pos.id)) n.delete(pos.id); else n.add(pos.id); return n; })} className="w-3.5 h-3.5 rounded border-slate-300 text-[#2b8de3] cursor-pointer" /></td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{index + 1}</td>
                    <td className="py-3 px-6">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium text-slate-800 dark:text-slate-100">{pos.name}</span>
                        {pos.status === "disabled" && <span className="px-1.5 py-0.5 bg-[#f0ad4e] text-white text-[9.5px] font-semibold rounded">Disabled</span>}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-right">
                      {canManage && <PositionActionMenu position={pos} onView={onView} onEdit={onEdit} onToggleStatus={onToggleStatus} onDelete={onDelete} />}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {onImport && <ImportPositionsModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onImport={onImport} existingPositions={positions} />}
    </div>
  );
}
