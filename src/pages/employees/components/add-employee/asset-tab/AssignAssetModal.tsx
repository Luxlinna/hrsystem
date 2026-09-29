import { useState, memo } from "react";
import type { AvailableAssetItem, AssignFormState } from "./types";
import type { EmployeeAssetBookingItem } from "../../types";

interface AssignAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: (bookings: EmployeeAssetBookingItem[]) => void;
  onOpenSelectModal: () => void;
  selectedAssets: AvailableAssetItem[];
  onRemoveAsset: (id: string) => void;
  onRemoveSelectedAssets: (ids: string[]) => void;
}

export const AssignAssetModal = memo(function AssignAssetModal({
  isOpen,
  onClose,
  onDone,
  onOpenSelectModal,
  selectedAssets,
  onRemoveSelectedAssets,
}: AssignAssetModalProps) {
  const [formState, setFormState] = useState<AssignFormState>({
    assignFor: "Full Day",
    fromDate: new Date().toISOString().split("T")[0],
    toDateNever: false,
    toDate: new Date().toISOString().split("T")[0],
    remark: "",
  });

  const [checkedTableIds, setCheckedTableIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (checkedTableIds.length === selectedAssets.length) {
      setCheckedTableIds([]);
    } else {
      setCheckedTableIds(selectedAssets.map((a) => a.id));
    }
  };

  const toggleItem = (id: string) => {
    setCheckedTableIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkRemove = () => {
    if (checkedTableIds.length > 0) {
      onRemoveSelectedAssets(checkedTableIds);
      setCheckedTableIds([]);
    }
  };

  const handleComplete = () => {
    const bookings: EmployeeAssetBookingItem[] = selectedAssets.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      tag: a.tag,
      assign_for: formState.assignFor,
      from_date: formState.fromDate,
      to_date_never: formState.toDateNever,
      to_date: formState.toDateNever ? "Never" : formState.toDate,
      remark: formState.remark,
      status: "Assigned",
    }));
    onDone(bookings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#253C7D] uppercase tracking-wider">
            ASSIGN INFO
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Top Form Grid */}
          <div className="space-y-4 max-w-2xl">
            {/* Assign For */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 sm:text-right">
                Assign For
              </label>
              <div className="flex items-center gap-4 text-xs text-slate-700">
                {(["Full Day", "Half Day", "Hourly"] as const).map((mode) => (
                  <label key={mode} className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="assignFor"
                      value={mode}
                      checked={formState.assignFor === mode}
                      onChange={() => setFormState((p) => ({ ...p, assignFor: mode }))}
                      className="w-3.5 h-3.5 text-[#253C7D] focus:ring-[#253C7D]"
                    />
                    <span>{mode}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* From Date */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-3">
              <label className="text-xs font-semibold text-slate-700 sm:text-right">
                From Date <span className="text-rose-500">*</span>
              </label>
              <div>
                <input
                  type="date"
                  value={formState.fromDate}
                  onChange={(e) => setFormState((p) => ({ ...p, fromDate: e.target.value }))}
                  className="px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white w-full max-w-xs"
                />
              </div>
            </div>

            {/* To Date */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-3">
              <label className="text-xs font-semibold text-slate-700 sm:text-right pt-1.5">
                To Date <span className="text-rose-500">*</span>
              </label>
              <div className="space-y-2">
                <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="toDateChoice"
                    checked={formState.toDateNever}
                    onChange={() => setFormState((p) => ({ ...p, toDateNever: true }))}
                    className="w-3.5 h-3.5 text-[#253C7D] focus:ring-[#253C7D]"
                  />
                  <span>Never</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="toDateChoice"
                    checked={!formState.toDateNever}
                    onChange={() => setFormState((p) => ({ ...p, toDateNever: false }))}
                    className="w-3.5 h-3.5 text-[#253C7D] focus:ring-[#253C7D]"
                  />
                  <input
                    type="date"
                    disabled={formState.toDateNever}
                    value={formState.toDate}
                    onChange={(e) => setFormState((p) => ({ ...p, toDate: e.target.value }))}
                    className="px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white disabled:bg-slate-100 disabled:text-slate-400 max-w-xs"
                  />
                </div>
              </div>
            </div>

            {/* Remark */}
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-start gap-3">
              <label className="text-xs font-semibold text-slate-700 sm:text-right pt-1.5">
                Remark <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formState.remark}
                onChange={(e) => setFormState((p) => ({ ...p, remark: e.target.value }))}
                placeholder="Remark"
                className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white resize-none"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleBulkRemove}
              disabled={checkedTableIds.length === 0}
              className="px-3 py-1.5 rounded-md border border-rose-300 hover:bg-rose-50 text-rose-600 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <i className="ri-delete-bin-line" />
              <span>Remove Asset</span>
            </button>
            <button
              type="button"
              onClick={onOpenSelectModal}
              className="px-3 py-1.5 rounded-md border border-[#253C7D] hover:bg-[#253C7D]/10 text-[#253C7D] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <i className="ri-add-circle-line" />
              <span>Add Asset</span>
            </button>
          </div>

          {/* Selected Assets Table */}
          <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedAssets.length > 0 && checkedTableIds.length === selectedAssets.length}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3 w-12 text-center">No.</th>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Asset Category</th>
                  <th className="py-2.5 px-3 w-28">Tag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                      No records found
                    </td>
                  </tr>
                ) : (
                  selectedAssets.map((asset, idx) => (
                    <tr key={asset.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={checkedTableIds.includes(asset.id)}
                          onChange={() => toggleItem(asset.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                        />
                      </td>
                      <td className="py-2 px-3 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-800">
                        {asset.name}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {asset.category}
                      </td>
                      <td className="py-2 px-3 text-slate-500 font-mono">
                        {asset.tag}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-start gap-2 bg-slate-50">
          <button
            type="button"
            onClick={handleComplete}
            disabled={selectedAssets.length === 0}
            className="px-4 py-1.5 rounded-md bg-[#253C7D] hover:bg-[#1E3064] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="ri-save-line" />
            <span>Done</span>
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
