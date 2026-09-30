import { memo } from "react";

interface AssetCategoryHeaderActionsProps {
  showCategoryDropdown: boolean;
  setShowCategoryDropdown: (val: boolean) => void;
  onOpenCreateCategory: () => void;
  onOpenRegisterAsset: () => void;
}

export const AssetCategoryHeaderActions = memo(function AssetCategoryHeaderActions({
  showCategoryDropdown,
  setShowCategoryDropdown,
  onOpenCreateCategory,
  onOpenRegisterAsset,
}: AssetCategoryHeaderActionsProps) {
  return (
    <div className="flex items-center justify-between pt-1">
      <h2 className="text-xl font-normal text-slate-700 tracking-tight">
        Asset Category
      </h2>

      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowCategoryDropdown(!showCategoryDropdown);
          }}
          className="px-3.5 py-1.5 rounded-sm bg-[#253C7D] hover:bg-[#1E2E5D] text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <span>Category</span>
          <i className="ri-arrow-down-s-line text-xs" />
        </button>

        {/* Dropdown Menu */}
        {showCategoryDropdown && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-9 w-48 rounded-md bg-white border border-slate-200/90 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs"
          >
            <button
              type="button"
              onClick={onOpenCreateCategory}
              className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <i className="ri-add-circle-line text-base text-slate-500" />
              <span>Create Category</span>
            </button>
            <button
              type="button"
              onClick={onOpenRegisterAsset}
              className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
            >
              <i className="ri-box-3-line text-base text-slate-500" />
              <span>Register Asset</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
