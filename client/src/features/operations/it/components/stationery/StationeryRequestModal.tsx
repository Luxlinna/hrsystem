import React from "react";
import type { StationeryRequestFormState, StationeryItem } from "../../types";

interface StationeryRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: StationeryRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<StationeryRequestFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  items: StationeryItem[];
}

export function StationeryRequestModal({
  isOpen,
  onClose,
  form,
  setForm,
  onSubmit,
  items,
}: StationeryRequestModalProps) {
  if (!isOpen) return null;

  const selectedItem = items.find((i) => i.id === form.item_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">
              Request Office Supplies
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Submit a supply requisition for approval and disbursement.
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

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Select Supply Item <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={form.item_id}
              onChange={(e) => setForm((prev) => ({ ...prev, item_id: e.target.value }))}
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
            >
              <option value="" disabled>
                -- Choose an item --
              </option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.stock_quantity} {item.unit} available)
                </option>
              ))}
            </select>
            {selectedItem && (
              <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                <i className="ri-information-line text-blue-500" />
                Current in stock: <strong className="text-gray-800">{selectedItem.stock_quantity} {selectedItem.unit}</strong> (SKU: {selectedItem.sku})
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Quantity Needed <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) || 1 }))}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Urgency
              </label>
              <select
                value={form.urgency}
                onChange={(e) => setForm((prev) => ({ ...prev, urgency: e.target.value as any }))}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent / Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Requester Name
              </label>
              <input
                type="text"
                value={form.requested_by_name}
                onChange={(e) => setForm((prev) => ({ ...prev, requested_by_name: e.target.value }))}
                placeholder="Staff name"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="e.g. Finance, Sales"
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Purpose / Reason
            </label>
            <textarea
              rows={2}
              value={form.purpose}
              onChange={(e) => setForm((prev) => ({ ...prev, purpose: e.target.value }))}
              placeholder="e.g. For quarterly financial audit documentation..."
              className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] resize-none"
            />
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
              Submit Requisition
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
