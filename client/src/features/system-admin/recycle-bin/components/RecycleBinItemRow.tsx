import { memo } from "react";
import type { BinItem } from "../types";
import { getModuleConfig } from "../recycleBinUtils";
import { isPhoneSyntheticEmail, syntheticEmailToPhone } from "@/lib/phoneUtils";
import { RecycleBinActionMenu } from "./RecycleBinActionMenu";

interface RecycleBinItemRowProps {
  item: BinItem;
  isAdmin: boolean;
  working: boolean;
  selected: boolean;
  onToggleSelect: (item: BinItem) => void;
  onRestore: (item: BinItem) => void;
  onConfirmDelete: (item: BinItem) => void;
}

export const RecycleBinItemRow = memo(function RecycleBinItemRow({
  item,
  isAdmin,
  working,
  selected,
  onToggleSelect,
  onRestore,
  onConfirmDelete,
}: RecycleBinItemRowProps) {
  const cfg = getModuleConfig(item.table);
  const deletedDate = new Date(item.deleted_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <tr className={`transition-colors text-xs ${selected ? "bg-blue-50/50" : "hover:bg-slate-50/80"}`}>
      {/* Checkbox */}
      <td className="py-3 px-4 text-center w-10">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(item)}
          disabled={working}
          className="w-3.5 h-3.5 rounded border-slate-300 text-[#0088cc] cursor-pointer"
          aria-label={`Select ${item.label}`}
        />
      </td>

      {/* Record Title & Detail */}
      <td className="py-3 px-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-900 text-[13px]">{item.label}</span>
          {item.detail && <span className="text-slate-500 text-xs">{item.detail}</span>}
        </div>
      </td>

      {/* Module */}
      <td className="py-3 px-4">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <i className={`${cfg?.icon || "ri-folder-line"} text-xs text-slate-500`} />
          <span>{cfg?.name || item.table}</span>
        </span>
      </td>

      {/* Deleted When & By */}
      <td className="py-3 px-4 text-slate-600">
        <div className="flex flex-col">
          <span className="font-medium text-slate-800">{deletedDate}</span>
          {item.deleted_by && (
            <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
              by {isPhoneSyntheticEmail(item.deleted_by) ? syntheticEmailToPhone(item.deleted_by) : item.deleted_by}
            </span>
          )}
        </div>
      </td>

      {/* Row Action Menu */}
      <td className="py-3 px-4 text-right w-24">
        <RecycleBinActionMenu
          item={item}
          isAdmin={isAdmin}
          working={working}
          onRestore={onRestore}
          onConfirmDelete={onConfirmDelete}
        />
      </td>
    </tr>
  );
});
