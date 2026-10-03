import { memo } from "react";
import { CATEGORY_TYPES, type AssetCategoryFormData } from "../types";

interface CategoryFormBasicFieldsProps {
  formData: AssetCategoryFormData;
  customType: string;
  setCustomType: (val: string) => void;
  onChange: (updater: (p: AssetCategoryFormData) => AssetCategoryFormData) => void;
}

export const CategoryFormBasicFields = memo(function CategoryFormBasicFields({
  formData,
  customType,
  setCustomType,
  onChange,
}: CategoryFormBasicFieldsProps) {
  return (
    <>
      {/* 1. Name Field */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
          Name <span className="text-red-500">*</span>
        </label>
        <div>
          <input
            type="text"
            required
            placeholder="Category Name"
            value={formData.name}
            onChange={(e) => onChange((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3498db] bg-white transition-colors"
          />
        </div>
      </div>

      {/* 2. Type Field with customizable 'Other' input */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-start gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1 pt-1.5">
          Type <span className="text-red-500">*</span>
        </label>
        <div className="w-full space-y-2">
          <select
            value={formData.type}
            onChange={(e) => onChange((p) => ({ ...p, type: e.target.value }))}
            className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 bg-white focus:outline-none focus:border-[#3498db] cursor-pointer transition-colors"
          >
            {CATEGORY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {formData.type === "Other" && (
            <input
              type="text"
              required
              placeholder="Type custom asset type..."
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3498db] bg-white transition-colors animate-in fade-in duration-100"
              autoFocus
            />
          )}
        </div>
      </div>

      {/* 3. Tag Field */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
          Tag
        </label>
        <div>
          <input
            type="text"
            placeholder="Tag"
            value={formData.tag}
            onChange={(e) => onChange((p) => ({ ...p, tag: e.target.value }))}
            className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3498db] bg-white transition-colors font-mono"
          />
        </div>
      </div>

      {/* 4. Seller / Vendor Name */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
          Seller Name
        </label>
        <div>
          <input
            type="text"
            placeholder="Seller / Vendor Name"
            value={formData.sellerName || ""}
            onChange={(e) => onChange((p) => ({ ...p, sellerName: e.target.value }))}
            className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3498db] bg-white transition-colors"
          />
        </div>
      </div>

      {/* 5. Purchase Invoice / PO Ref */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
          Invoice / PO Ref
        </label>
        <div>
          <input
            type="text"
            placeholder="Invoice or Purchase Order Ref #"
            value={formData.invoiceRef || ""}
            onChange={(e) => onChange((p) => ({ ...p, invoiceRef: e.target.value }))}
            className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#3498db] bg-white transition-colors"
          />
        </div>
      </div>

      {/* 6. Clean Single Serial Number Field */}
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-4">
        <label className="text-xs font-medium text-gray-700 sm:text-right pr-1">
          Serial Number
        </label>
        <div>
          <input
            type="text"
            placeholder="Serial Number"
            value={formData.serialNumber || ""}
            onChange={(e) => onChange((p) => ({ ...p, serialNumber: e.target.value }))}
            className="w-full px-3 py-1.5 rounded border border-gray-300 text-xs text-gray-800 font-mono placeholder-gray-400 focus:outline-none focus:border-[#3498db] bg-white transition-colors"
          />
        </div>
      </div>
    </>
  );
});
