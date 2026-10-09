import { useState, memo } from "react";
import type { AvailableAssetItem, AssignFormState } from "./types";
import type { EmployeeAssetBookingItem } from "../../../types";
import { AssignAssetFormFields } from "./AssignAssetFormFields";
import { AssignAssetTable } from "./AssignAssetTable";

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
          <AssignAssetFormFields formState={formState} setFormState={setFormState} />

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

          <AssignAssetTable
            selectedAssets={selectedAssets}
            checkedTableIds={checkedTableIds}
            onToggleSelectAll={toggleSelectAll}
            onToggleItem={toggleItem}
          />
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
