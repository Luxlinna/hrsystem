import React from "react";
import type { StationeryItemFormState, StationeryItem } from "../../types";
import { STATIONERY_CATEGORIES } from "../../constants";

interface StationeryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: StationeryItemFormState;
  setForm: React.Dispatch<React.SetStateAction<StationeryItemFormState>>;
  onSave: (e: React.FormEvent) => void;
  editingItem: StationeryItem | null;
}

export function StationeryItemModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSave,
  editingItem,
}: StationeryItemModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-gray-100 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">
              {editingItem ? "Edit Stationery Item" : "Add Stationery & Supply Item"}
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Manage office consumable details and minimum stock thresholds.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="e.g. Double A A4 Copier Paper (80gsm)"
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
              >
                {STATIONERY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                SKU / Item Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.sku}
                onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                placeholder="e.g. PAP-A4-80G"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs uppercase font-mono focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                min="0"
                value={form.stock_quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, stock_quantity: Number(e.target.value) || 0 }))}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Min Threshold
              </label>
              <input
                type="number"
                min="0"
                value={form.min_stock_level}
                onChange={(e) => setForm((prev) => ({ ...prev, min_stock_level: Number(e.target.value) || 0 }))}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Unit (e.g. box, ream)
              </label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="reams"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Storage Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Cabinet A-1"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Estimated Unit Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.unit_cost}
                onChange={(e) => setForm((prev) => ({ ...prev, unit_cost: e.target.value === "" ? "" : Number(e.target.value) }))}
                placeholder="4.50"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1f3268] rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              {editingItem ? "Save Changes" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
