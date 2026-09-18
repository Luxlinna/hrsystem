import { memo, useState, useRef, useEffect } from "react";
import type { ExitReasonTypeSetting } from "./types";

interface ExitReasonTypeTableProps {
  items: ExitReasonTypeSetting[];
  loading: boolean;
  onEdit: (item: ExitReasonTypeSetting) => void;
  onToggleStatus: (item: ExitReasonTypeSetting) => void;
  onDelete: (id: string) => void;
}

export const ExitReasonTypeTable = memo(function ExitReasonTypeTable({
  items,
  loading,
  onEdit,
  onToggleStatus,
  onDelete,
}: ExitReasonTypeTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-400 dark:text-slate-500">
        <div className="w-5 h-5 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs font-medium">Loading reason types...</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-3">
          <i className="ri-questionnaire-line text-2xl" />
        </div>
        <p className="text-xs font-bold text-gray-700 dark:text-slate-200">No reason types found</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Click + Add Reason Type to create one</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 dark:border-slate-800 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <th className="py-3 px-3 w-16 text-left">No.</th>
            <th className="py-3 px-3">Name</th>
            <th className="py-3 px-3 w-28 text-center">Status</th>
            <th className="py-3 px-3 w-20 text-right"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-slate-800/60 text-xs">
          {items.map((item, index) => {
            const isActive = item.status === "active";
            const isMenuOpen = openMenuId === item.id;

            return (
              <tr
                key={item.id}
                className="hover:bg-gray-50/70 dark:hover:bg-slate-800/40 transition-colors group"
              >
                <td className="py-3 px-3 font-semibold text-gray-500 dark:text-slate-400">
                  {index + 1}
                </td>
                <td className="py-3 px-3 font-medium text-gray-800 dark:text-slate-200">
                  {item.name}
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60"
                        : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-400 border border-gray-200/60"
                    }`}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 px-3 text-right relative">
                  <div className="relative inline-block text-left" ref={isMenuOpen ? menuRef : null}>
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(isMenuOpen ? null : item.id)}
                      className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                    >
                      <i className="ri-more-2-fill text-base" />
                    </button>

                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEdit(item);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer"
                        >
                          <i className="ri-edit-line text-xs text-blue-500" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onToggleStatus(item);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer border-t border-gray-50 dark:border-slate-700/50"
                        >
                          <i
                            className={`text-xs ${
                              isActive
                                ? "ri-eye-off-line text-amber-500"
                                : "ri-eye-line text-emerald-500"
                            }`}
                          />
                          {isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDelete(item.id);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer border-t border-gray-50 dark:border-slate-700/50"
                        >
                          <i className="ri-delete-bin-line text-xs" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
