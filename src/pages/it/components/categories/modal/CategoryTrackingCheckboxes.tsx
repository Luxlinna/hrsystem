import { memo } from "react";
import type { AssetCategoryFormData } from "../types";

interface CategoryTrackingCheckboxesProps {
  formData: AssetCategoryFormData;
  onChange: (updater: (p: AssetCategoryFormData) => AssetCategoryFormData) => void;
}

export const CategoryTrackingCheckboxes = memo(function CategoryTrackingCheckboxes({
  formData,
  onChange,
}: CategoryTrackingCheckboxesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start gap-4">
      <div className="hidden sm:block" />
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-xs text-gray-700 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.manageQuantity}
              onChange={(e) => onChange((p) => ({ ...p, manageQuantity: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#3498db] focus:ring-[#3498db] cursor-pointer"
            />
            <span>Manage Quantity</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-gray-700 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.allowRequest}
              onChange={(e) => onChange((p) => ({ ...p, allowRequest: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#3498db] focus:ring-[#3498db] cursor-pointer"
            />
            <span>Allow Request</span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="inline-flex items-center gap-2 text-xs text-gray-700 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.trackSerialNumber}
              onChange={(e) => onChange((p) => ({ ...p, trackSerialNumber: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#3498db] focus:ring-[#3498db] cursor-pointer"
            />
            <span>Track Serial Number</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-gray-700 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.trackWarranty}
              onChange={(e) => onChange((p) => ({ ...p, trackWarranty: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#3498db] focus:ring-[#3498db] cursor-pointer"
            />
            <span>Track Warranty</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-gray-700 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={formData.trackTagging}
              onChange={(e) => onChange((p) => ({ ...p, trackTagging: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-[#3498db] focus:ring-[#3498db] cursor-pointer"
            />
            <span>Track Tagging</span>
          </label>
        </div>
      </div>
    </div>
  );
});
