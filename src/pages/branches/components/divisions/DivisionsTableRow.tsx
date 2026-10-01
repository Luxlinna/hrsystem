import { memo } from "react";
import { DivisionActionMenu } from "./DivisionActionMenu";
import type { Division } from "../../types";

interface Props {
  division: Division;
  index: number;
  canManage: boolean;
  onView: (div: Division) => void;
  onEdit: (div: Division) => void;
  onToggleStatus: (div: Division) => void;
  onDelete: (div: Division) => void;
}

export const DivisionsTableRow = memo(function DivisionsTableRow({
  division,
  index,
  canManage,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: Props) {
  const isDisabled = division.status === "disabled";

  return (
    <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
      <td className="py-3 px-6 font-normal text-slate-600 dark:text-slate-400">
        {index + 1}
      </td>
      <td className="py-3 px-6">
        <div className="flex flex-col items-start gap-1">
          <span className="font-semibold uppercase text-slate-800 dark:text-slate-100">
            {division.name}
          </span>
          {isDisabled && (
            <span className="inline-block px-1.5 py-0.5 bg-[#f0ad4e] text-white text-[9.5px] font-semibold rounded leading-none shadow-2xs">
              Disabled
            </span>
          )}
        </div>
      </td>
      <td className="py-3 px-6 text-slate-700 dark:text-slate-300">
        {division.head_of_division_name || "—"}
      </td>
      <td className="py-3 px-6 text-right">
        {canManage && (
          <DivisionActionMenu
            division={division}
            onView={onView}
            onEdit={onEdit}
            onToggleStatus={onToggleStatus}
            onDelete={onDelete}
          />
        )}
      </td>
    </tr>
  );
});
