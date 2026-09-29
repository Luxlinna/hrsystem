import React, { useState, useMemo } from "react";
import type { AssetLocation, AssetConditionItem } from "../../types";
import { toast } from "@/components/Toast";

interface AssetInventorySettingsProps {
  onBack: () => void;
  canManage?: boolean;
}

export const AssetInventorySettings: React.FC<AssetInventorySettingsProps> = ({
  onBack,
  canManage = true,
}) => {
  const [activeTab, setActiveTab] = useState<"locations" | "conditions">("locations");

  // State for Locations (empty initially or user created)
  const [locations, setLocations] = useState<AssetLocation[]>([]);

  // State for Conditions (empty initially or user created)
  const [conditions, setConditions] = useState<AssetConditionItem[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Inactive">("all");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formRemark, setFormRemark] = useState("");

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (statusFilter !== "all" && loc.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return loc.name.toLowerCase().includes(q) || (loc.remark || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [locations, statusFilter, searchQuery]);

  const filteredConditions = useMemo(() => {
    return conditions.filter((cond) => {
      if (statusFilter !== "all" && cond.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return cond.name.toLowerCase().includes(q) || (cond.remark || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [conditions, statusFilter, searchQuery]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormRemark("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: AssetLocation | AssetConditionItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormRemark(item.remark || "");
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Are you sure you want to remove this entry?")) return;
    if (activeTab === "locations") {
      setLocations((prev) => prev.filter((l) => l.id !== id));
      toast("Location Removed", "Location deleted successfully.", "success");
    } else {
      setConditions((prev) => prev.filter((c) => c.id !== id));
      toast("Condition Removed", "Condition deleted successfully.", "success");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast("Required Field", "Please enter a name.", "error");
      return;
    }

    if (activeTab === "locations") {
      if (editingId) {
        setLocations((prev) =>
          prev.map((l) => (l.id === editingId ? { ...l, name: formName, remark: formRemark } : l))
        );
        toast("Location Updated", "Location details saved.", "success");
      } else {
        const newLoc: AssetLocation = {
          id: `loc-${Date.now()}`,
          name: formName,
          remark: formRemark,
          status: "Active",
        };
        setLocations((prev) => [...prev, newLoc]);
        toast("Location Created", "New location added successfully.", "success");
      }
    } else {
      if (editingId) {
        setConditions((prev) =>
          prev.map((c) => (c.id === editingId ? { ...c, name: formName, remark: formRemark } : c))
        );
        toast("Condition Updated", "Condition details saved.", "success");
      } else {
        const newCond: AssetConditionItem = {
          id: `cond-${Date.now()}`,
          name: formName,
          remark: formRemark,
          status: "Active",
        };
        setConditions((prev) => [...prev, newCond]);
        toast("Condition Created", "New condition added successfully.", "success");
      }
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 select-none">
      {/* Top Setting Header matching Screenshot */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-normal text-slate-700 tracking-tight">Setting</h1>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-slate-300 bg-slate-100/90 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-all cursor-pointer shadow-2xs"
        >
          <i className="ri-arrow-left-line text-xs" />
          <span>Back</span>
        </button>
      </div>

      {/* Setting Navigation Sub-Tabs matching Screenshot */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setActiveTab("locations");
            setSearchQuery("");
            setStatusFilter("all");
          }}
          className={`pb-2 transition-all cursor-pointer ${
            activeTab === "locations"
              ? "border-b-2 border-[#2585c8] text-[#2585c8] font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Locations
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("conditions");
            setSearchQuery("");
            setStatusFilter("all");
          }}
          className={`pb-2 transition-all cursor-pointer ${
            activeTab === "conditions"
              ? "border-b-2 border-[#2585c8] text-[#2585c8] font-bold"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Condition
        </button>
      </div>

      {/* Section Header: LOCATION INFO / CONDITION INFO */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-xs font-bold text-[#2585c8] uppercase tracking-wider">
          {activeTab === "locations" ? "LOCATION INFO" : "CONDITION INFO"}
        </h2>
        {canManage && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#62a7e0] bg-white hover:bg-[#f0f7fd] text-[#2585c8] text-xs font-medium transition-all shadow-2xs cursor-pointer"
          >
            <i className="ri-add-circle-line text-xs" />
            <span>{activeTab === "locations" ? "Add Location" : "Add Condition"}</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar matching Screenshot */}
      <div className="flex items-center justify-between gap-3">
        {/* Search */}
        <div className="flex items-center rounded-sm border border-slate-300 focus-within:border-[#2585c8] bg-white overflow-hidden shadow-2xs max-w-xs w-full transition-colors h-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
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
          <div className="bg-[#2585c8] text-white px-3 h-full flex items-center justify-center">
            <i className="ri-search-line text-xs" />
          </div>
        </div>

        {/* Status Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStatusMenu((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#62a7e0] bg-white hover:bg-[#f0f7fd] text-[#2585c8] text-xs font-medium transition-all shadow-2xs cursor-pointer h-7"
          >
            <span>Status</span>
            <i className="ri-arrow-down-s-line text-xs" />
          </button>

          {showStatusMenu && (
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-md shadow-xl border border-slate-200 py-1 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
              {(["all", "Active", "Inactive"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setStatusFilter(st);
                    setShowStatusMenu(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between font-medium ${
                    statusFilter === st ? "bg-slate-50 text-[#2585c8] font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{st === "all" ? "All Statuses" : st}</span>
                  {statusFilter === st && <i className="ri-check-line text-[#2585c8]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table matching Screenshot */}
      <div className="overflow-x-auto bg-white border border-slate-200/80 rounded-sm shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-white text-[11px] font-semibold text-slate-700">
              <th className="px-4 py-3 w-16 text-slate-700 font-semibold">No.</th>
              <th className="px-4 py-3 text-slate-700 font-semibold">
                {activeTab === "locations" ? "Location Name" : "Condition Name"}
              </th>
              <th className="px-4 py-3 text-slate-700 font-semibold">Remark</th>
              <th className="px-4 py-3 w-28 text-slate-700 font-semibold">Status</th>
              {canManage && <th className="px-4 py-3 w-20 text-right text-slate-700 font-semibold">Action</th>}
            </tr>
          </thead>
          <tbody>
            {(activeTab === "locations" ? filteredLocations : filteredConditions).length === 0 ? (
              <tr>
                <td
                  colSpan={canManage ? 5 : 4}
                  className="py-3 px-4 text-center bg-[#f4f6f9] border-t border-slate-200 text-xs font-bold text-slate-700"
                >
                  No records found
                </td>
              </tr>
            ) : (
              (activeTab === "locations" ? filteredLocations : filteredConditions).map((item, index) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 text-slate-600 font-medium">{index + 1}</td>
                  <td className="px-4 py-3 text-slate-900 font-semibold">{item.name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.remark || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        item.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-400 hover:text-[#2585c8] hover:bg-slate-100 rounded transition-colors"
                          title="Edit"
                        >
                          <i className="ri-edit-line text-xs" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line text-xs" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal matching Screenshot */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-xl bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header matching Screenshot */}
            <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-white">
              <h2 className="text-sm font-bold text-[#2585c8] uppercase tracking-wide">
                {activeTab === "locations" ? "LOCATION" : "CONDITION"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-base" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Field: Name */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
                <label className="sm:col-span-4 text-xs font-semibold text-slate-700 sm:text-right sm:pr-2">
                  {activeTab === "locations" ? "Location Name" : "Condition Name"}{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="sm:col-span-8">
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={activeTab === "locations" ? "Location Name" : "Condition Name"}
                    className="w-full px-3 py-1.5 rounded-sm bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#2585c8]"
                    autoFocus
                  />
                </div>
              </div>

              {/* Field: Remark */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-start">
                <label className="sm:col-span-4 text-xs font-semibold text-slate-700 sm:text-right sm:pr-2 sm:pt-2">
                  Remark
                </label>
                <div className="sm:col-span-8">
                  <textarea
                    rows={3}
                    value={formRemark}
                    onChange={(e) => setFormRemark(e.target.value)}
                    placeholder="Remark"
                    className="w-full px-3 py-1.5 rounded-sm bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#2585c8] resize-y"
                  />
                </div>
              </div>

              {/* Footer Buttons: Done and Cancel matching Screenshot */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-sm bg-[#2585c8] hover:bg-[#1f73b0] text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <i className="ri-checkbox-circle-line text-xs" />
                  <span>Done</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 rounded-sm border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <i className="ri-close-line text-xs" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
