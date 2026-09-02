import React from "react";
import type { StationeryItem } from "../../types";

interface StationeryRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: StationeryItem | null;
  restockQuantity: number;
  setRestockQuantity: (n: number) => void;
  onConfirm: (e: React.FormEvent) => void;
}

export function StationeryRestockModal({
  isOpen,
  onClose,
  targetItem,
  restockQuantity,
  setRestockQuantity,
  onConfirm,
}: StationeryRestockModalProps) {
  if (!isOpen || !targetItem) return null;

  const newTotal = targetItem.stock_quantity + (Number(restockQuantity) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">
              Restock Supply Units
            </h3>
            <p className="text-xs text-gray-400 font-medium">
              Add new delivery quantity to inventory.
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

        <form onSubmit={onConfirm} className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 space-y-1">
            <p className="text-xs font-bold text-gray-900">{targetItem.name}</p>
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>SKU: {targetItem.sku}</span>
              <span>Current: <strong className="text-gray-800">{targetItem.stock_quantity} {targetItem.unit}</strong></span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Quantity to Add (+ {targetItem.unit})
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                required
                value={restockQuantity}
                onChange={(e) => setRestockQuantity(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm font-bold text-emerald-700 tabular-nums focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[5, 10, 20, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setRestockQuantity(preset)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  +{preset}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs text-emerald-900 font-medium flex items-center justify-between">
            <span>New Stock Total:</span>
            <strong className="text-sm font-black text-emerald-700 tabular-nums">
              {newTotal} {targetItem.unit}
            </strong>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-check-line font-bold" />
              Confirm Restock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
