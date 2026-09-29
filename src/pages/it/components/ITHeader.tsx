import { memo, useState, useRef, useEffect } from "react";
import type { ITTabType } from "../types";

interface ITHeaderProps {
  canManage: boolean;
  onOpenAssetModal: () => void;
  onOpenSettings?: () => void;
  tab?: ITTabType;
}

export const ITHeader = memo(function ITHeader({
  canManage,
  onOpenAssetModal,
  onOpenSettings,
  tab = "assets",
}: ITHeaderProps) {
  const [showAssetMenu, setShowAssetMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAssetMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center justify-between gap-4 mb-4 select-none">
      {/* Title matching Screenshot 1 */}
      <div>
        <h1 className="text-xl font-medium text-slate-700 tracking-tight">
          {tab === "assets"
            ? "Asset Inventory"
            : tab === "categories"
            ? "Asset Categories"
            : tab === "tickets"
            ? "Helpdesk Tickets"
            : tab === "stationery"
            ? "Stationery & Supplies"
            : tab === "settings"
            ? "Setting"
            : "Enterprise Security"}
        </h1>
      </div>

      {/* Right Action Button matching Screenshot 1 */}
      <div className="flex items-center gap-2">
        {canManage && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowAssetMenu((prev) => !prev)}
              className="inline-flex items-center gap-2 bg-[#2585c8] hover:bg-[#1f73b0] text-white px-3.5 py-1.5 rounded-sm text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
            >
              <span>Asset Inventory</span>
              <i className="ri-arrow-down-s-line text-xs ml-0.5" />
            </button>

            {showAssetMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-md shadow-xl border border-slate-200/90 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-100 text-xs">
                {/* Popover Triangle Arrow Pointer */}
                <div className="absolute -top-1.5 right-6 w-3 h-3 bg-white border-t border-l border-slate-200/90 rotate-45 z-40" />

                <button
                  type="button"
                  onClick={() => {
                    onOpenAssetModal();
                    setShowAssetMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium relative z-50 cursor-pointer"
                >
                  <i className="ri-add-circle-line text-slate-500 text-base" />
                  <span className="text-slate-700 text-xs">Create Asset Inventory</span>
                </button>

                {onOpenSettings && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenSettings();
                      setShowAssetMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 font-medium relative z-50 cursor-pointer"
                  >
                    <i className="ri-settings-3-line text-slate-500 text-base" />
                    <span className="text-slate-700 text-xs">Setting</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});



