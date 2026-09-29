import { useState, useMemo, memo } from "react";
import type { AvailableAssetItem } from "./types";

interface SelectAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableAssets: AvailableAssetItem[];
  onSelect: (selectedAssets: AvailableAssetItem[]) => void;
}

export const SelectAssetModal = memo(function SelectAssetModal({
  isOpen,
  onClose,
  availableAssets,
  onSelect,
}: SelectAssetModalProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    availableAssets.forEach((a) => a.category && set.add(a.category));
    return ["All", ...Array.from(set)];
  }, [availableAssets]);

  const filtered = useMemo(() => {
    return availableAssets.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase()) ||
        item.tag.toLowerCase().includes(search.toLowerCase());

      const matchesCat =
        categoryFilter === "All" || item.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [availableAssets, search, categoryFilter]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((item) => item.id));
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    const chosen = availableAssets.filter((a) => selectedIds.includes(a.id));
    onSelect(chosen);
    setSelectedIds([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#253C7D] uppercase tracking-wider">
            SELECT ASSET
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Search & Filter */}
        <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex rounded-md overflow-hidden border border-slate-300 bg-white max-w-sm w-full focus-within:border-[#253C7D] focus-within:ring-1 focus-within:ring-[#253C7D]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              type="button"
              className="px-3 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="ri-search-line" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-700 bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "Filter All" : c.split(":")[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table List */}
        <div className="flex-1 overflow-y-auto min-h-[250px] max-h-[420px]">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold sticky top-0">
              <tr>
                <th className="py-2 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                  />
                </th>
                <th className="py-2 px-3 w-12 text-center">No.</th>
                <th className="py-2 px-3 w-1/2">
                  <div className="flex items-center gap-1 cursor-pointer select-none">
                    <span>Category</span>
                    <i className="ri-arrow-up-down-line text-slate-400 text-[10px]" />
                  </div>
                </th>
                <th className="py-2 px-3">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-medium">
                    No matching assets found
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isChecked = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`hover:bg-[#253C7D]/5 transition-colors cursor-pointer ${
                        isChecked ? "bg-[#253C7D]/10" : ""
                      }`}
                    >
                      <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(item.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-800 leading-tight">
                          {item.category}
                        </div>
                        {item.subType && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {item.subType}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-700 font-medium">
                        {item.name}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedIds.length === 0}
            className="px-4 py-1.5 rounded-md bg-[#253C7D] hover:bg-[#1E3064] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="ri-save-line" />
            <span>Select</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
});
