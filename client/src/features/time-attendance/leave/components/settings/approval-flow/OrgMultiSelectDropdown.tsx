import React, { useState, useRef, useEffect, useMemo } from "react";

export type DropdownOption = string | { label: string; value: string; badge?: string };

interface OrgMultiSelectDropdownProps {
  value: string[];
  options: DropdownOption[];
  onChange: (newVals: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const OrgMultiSelectDropdown: React.FC<OrgMultiSelectDropdownProps> = ({
  value,
  options,
  onChange,
  placeholder = "Select",
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [isOpen]);

  const normalizedOptions = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { label: opt, value: opt };
      }
      return opt;
    });
  }, [options]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter(
      (opt) => opt.label.toLowerCase().includes(q) || (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  }, [normalizedOptions, search]);

  const handleToggle = (val: string) => {
    if (val === "All") {
      onChange(["All"]);
      return;
    }
    const cleanList = value.filter((x) => x !== "All");
    if (cleanList.includes(val)) {
      const next = cleanList.filter((x) => x !== val);
      onChange(next);
    } else {
      onChange([...cleanList, val]);
    }
  };

  const handleRemove = (val: string) => {
    const next = value.filter((x) => x !== val);
    onChange(next);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Box matching Screenshot 2 */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full min-h-[34px] px-3 py-1 border rounded bg-white dark:bg-slate-800 flex items-center justify-between cursor-pointer transition-colors text-xs select-none ${
          isOpen
            ? "border-[#29ABE2] ring-1 ring-[#29ABE2]/30"
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400"
        }`}
      >
        {value.length === 0 ? (
          <span className="text-slate-400 dark:text-slate-500 font-normal">
            {placeholder}
          </span>
        ) : (
          <div className="flex items-center flex-wrap gap-1 flex-1 py-0.5 pr-2">
            {value.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-normal border border-slate-200/60 dark:border-slate-600"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item);
                  }}
                  className="text-slate-400 hover:text-rose-500 cursor-pointer text-xs leading-none"
                  title={`Remove ${item}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <i
          className={`ri-arrow-down-s-line text-slate-400 text-sm shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#29ABE2]" : ""
          }`}
        />
      </div>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-xl text-xs overflow-hidden animate-in fade-in-50">
          {normalizedOptions.length > 5 && (
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="relative">
                <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-7 pr-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#29ABE2]"
                />
              </div>
            </div>
          )}

          <div className="max-h-56 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/40">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-slate-400 text-xs">
                No options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = value.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleToggle(opt.value)}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-sky-50 dark:bg-sky-950/40 text-[#29ABE2] font-semibold"
                        : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{opt.label}</span>
                      {opt.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200/60 dark:border-slate-600 font-normal">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <i className="ri-check-line text-[#29ABE2] font-bold text-sm" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
