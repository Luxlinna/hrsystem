import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWarningPermission } from "../hooks/useWarningPermission";
import { useWarningSettings } from "./useWarningSettings";
import { WarningTypeModal } from "./WarningTypeModal";
import { WarningSettingsTable } from "./WarningSettingsTable";
import type { WarningTypeSetting } from "./types";

export default function WarningSettingsPage() {
  const navigate = useNavigate();
  const { canManageWarningSettings } = useWarningPermission();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WarningTypeSetting | null>(null);

  const {
    warningTypes,
    rawWarningTypes,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    saveWarningType,
    toggleStatus,
    deleteWarningType,
  } = useWarningSettings();

  if (!canManageWarningSettings) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-24 space-y-4 font-sans">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-3xl">
          <i className="ri-shield-cross-line" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Only BU CEO Admin and SuperAdmin can view Warning Settings, unless configured at role permissions.
        </p>
        <button
          onClick={() => navigate("/disciplinary")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          <i className="ri-arrow-left-line" />
          Back to Disciplinary Hub
        </button>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: WarningTypeSetting) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16 font-sans">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 mb-6 sticky top-0 z-20 flex items-center justify-between shadow-2xs">
        <h1 className="text-xl font-black text-slate-800 tracking-tight">Warning Setting</h1>
        <Link
          to="/disciplinary"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md transition-colors shadow-2xs cursor-pointer"
        >
          <i className="ri-arrow-left-line text-sm" />
          Back
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="text-xs font-black tracking-wider text-sky-600 uppercase">
              Warning Type Info
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-sky-600 text-sky-600 hover:bg-sky-50 rounded-md text-xs font-bold transition-colors cursor-pointer"
            >
              <i className="ri-add-circle-line text-sm" />
              Add More Warning Type
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center w-full sm:w-80">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 border border-r-0 border-slate-300 rounded-l-md text-xs focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-r-md text-xs transition-colors cursor-pointer"
              >
                <i className="ri-search-line" />
              </button>
            </div>

            <div className="w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 border border-slate-300 rounded-md text-xs text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                <option value="all">Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Loading warning types...
            </div>
          ) : (
            <WarningSettingsTable
              warningTypes={warningTypes}
              onOpenEdit={handleOpenEdit}
              onToggleStatus={toggleStatus}
              onDelete={deleteWarningType}
            />
          )}
        </div>
      </div>

      <WarningTypeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        editingItem={editingItem}
        onSave={saveWarningType}
        saving={saving}
        itemCount={rawWarningTypes.length}
      />
    </div>
  );
}
