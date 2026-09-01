import { memo } from "react";
import type { ITAsset, AssetFormState, Employee, Branch } from "../../types";
import { ASSET_TYPE_CONFIG } from "../../constants";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingAsset: ITAsset | null;
  assetForm: AssetFormState;
  setAssetForm: React.Dispatch<React.SetStateAction<AssetFormState>>;
  saving: boolean;
  employees: Employee[];
  branches: Branch[];
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
}

export const AssetModal = memo(function AssetModal({
  isOpen,
  onClose,
  editingAsset,
  assetForm,
  setAssetForm,
  saving,
  employees,
  branches,
  onSubmit,
}: AssetModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">
              {editingAsset ? "Edit IT Asset Details" : "Register New Hardware Asset"}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {editingAsset ? "Update hardware metadata and allocation" : "Add a new device to company IT inventory"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Device / Asset Name *
              </label>
              <input
                type="text"
                required
                value={assetForm.name}
                onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                placeholder="e.g. MacBook Pro 16 M3 Max"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Asset Tag / SKU *
              </label>
              <input
                type="text"
                required
                value={assetForm.asset_tag}
                onChange={(e) => setAssetForm({ ...assetForm, asset_tag: e.target.value.toUpperCase() })}
                placeholder="e.g. AST-MBP-2026-042"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Asset Category
              </label>
              <select
                value={assetForm.type}
                onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-bold focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {Object.keys(ASSET_TYPE_CONFIG).map((t) => (
                  <option key={t} value={t}>
                    {ASSET_TYPE_CONFIG[t].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={assetForm.serial_number}
                onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
                placeholder="e.g. C02G873P0D6"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Assign to Employee
              </label>
              <select
                value={assetForm.employee_id}
                onChange={(e) => setAssetForm({ ...assetForm, employee_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="">Unassigned (Inventory Pool)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.first_name} {emp.last_name} ({emp.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                Branch Location
              </label>
              <select
                value={assetForm.branch_id}
                onChange={(e) => setAssetForm({ ...assetForm, branch_id: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="">Default Headquarters</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Asset Status
            </label>
            <select
              value={assetForm.status}
              onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-bold focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="active">Active / Deployed</option>
              <option value="inventory">In Stock / Pool</option>
              <option value="maintenance">Under Repair / Maintenance</option>
              <option value="retired">Retired / Decommissioned</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : editingAsset ? "Save Changes" : "Register Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
