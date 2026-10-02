import { memo } from "react";

interface Item {
  id: string;
  label: string;
}

interface Props {
  title: string;
  items: Item[];
  selectedId: string;
  onSelect: (id: string) => void;
  allLabel?: string;
}

export const FilterSubMenu = memo(function FilterSubMenu({
  title,
  items,
  selectedId,
  onSelect,
  allLabel = `All ${title}`,
}: Props) {
  return (
    <div className="absolute left-full top-0 -ml-1 sm:ml-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
      <button
        type="button"
        onClick={() => onSelect("all")}
        className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer ${
          selectedId === "all"
            ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold"
            : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        }`}
      >
        <span>{allLabel}</span>
        {selectedId === "all" && <i className="ri-check-line font-bold" />}
      </button>

      <div className="border-t border-slate-100 dark:border-slate-800 my-0.5" />

      {items.map((item) => {
        const isSelected = selectedId === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-xs text-left cursor-pointer truncate ${
              isSelected
                ? "bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold"
                : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <span className="truncate">{item.label}</span>
            {isSelected && <i className="ri-check-line font-bold shrink-0 ml-1" />}
          </button>
        );
      })}
    </div>
  );
});
