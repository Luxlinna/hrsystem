import { useState, useEffect, useRef, useMemo } from "react";

export interface SelectOption {
  id: string | number;
  name: string;
  code?: string | null;
  icon?: string;
  badge?: string;
  description?: string;
  status?: string;
}

export type SearchSelectOption = string | SelectOption;

interface Props {
  options: SearchSelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  icon?: string;
  searchable?: boolean;
  required?: boolean;
  disabled?: boolean;
  allowCustom?: boolean;
  headerTitle?: string;
  className?: string;
}

export function ModernSearchSelect({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  icon = "ri-list-check",
  searchable,
  required = false,
  disabled = false,
  allowCustom = false,
  headerTitle,
  className = "",
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Normalize options to object list
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt, idx) => {
      if (typeof opt === "string") {
        return { id: `opt-${idx}-${opt}`, name: opt };
      }
      return opt;
    });
  }, [options]);

  const activeOptions = useMemo(() => {
    return normalizedOptions.filter((p) => (p.status || "active") === "active");
  }, [normalizedOptions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return activeOptions;
    return activeOptions.filter(
      (opt) =>
        opt.name.toLowerCase().includes(q) ||
        (opt.code && opt.code.toLowerCase().includes(q)) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [activeOptions, query]);

  // Determine if search box should be visible (default to true if > 5 options)
  const showSearch = searchable !== undefined ? searchable : activeOptions.length > 5;

  // Selected item object (if exists in list)
  const selectedOption = useMemo(() => {
    return (
      activeOptions.find(
        (o) =>
          o.name.toLowerCase() === (value || "").toLowerCase() ||
          String(o.id) === String(value)
      ) || null
    );
  }, [activeOptions, value]);

  const displayLabel = selectedOption ? selectedOption.name : value;

  // Close when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    if (showSearch && inputRef.current) inputRef.current.focus();
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Trigger Box */}
      <div
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
          if (!open && showSearch) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`w-full pl-8 pr-7 py-1.5 bg-slate-50/70 border rounded-xl text-xs transition-all flex items-center justify-between select-none shadow-2xs ${
          disabled
            ? "opacity-60 cursor-not-allowed border-slate-200"
            : open
            ? "border-blue-500 ring-2 ring-blue-500/20 bg-white cursor-pointer"
            : "border-slate-200 hover:bg-white cursor-pointer"
        }`}
      >
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
          <i className={icon} />
        </div>

        <span
          className={`truncate ${
            displayLabel ? "text-slate-800 font-semibold" : "text-slate-400 font-normal"
          }`}
        >
          {displayLabel || placeholder}
        </span>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
          {displayLabel && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
              title="Clear selection"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
          <i
            className={`ri-arrow-down-s-line text-slate-400 text-xs transition-transform duration-200 ${
              open ? "rotate-180 text-blue-600" : ""
            }`}
          />
        </div>
      </div>

      {/* Hidden input to satisfy form required constraint */}
      {required && (
        <input
          type="text"
          value={value || ""}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Floating Dropdown Popover */}
      {open && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Inner Search Box */}
          {showSearch && (
            <div className="p-2.5 border-b border-slate-100 bg-slate-50/60">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                  <i className="ri-search-line" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlight(0);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHighlight((h) => (filtered.length ? Math.min(h + 1, filtered.length - 1) : 0));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHighlight((h) => Math.max(h - 1, 0));
                    } else if (e.key === "Enter") {
                      e.preventDefault();
                      if (filtered[highlight]) {
                        handleSelect(filtered[highlight].name);
                      } else if (allowCustom && query.trim()) {
                        handleSelect(query.trim());
                      }
                    } else if (e.key === "Escape") {
                      setOpen(false);
                    }
                  }}
                  placeholder="Type to search..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
                />
              </div>
            </div>
          )}

          {/* List Header */}
          <div className="px-3 py-1.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>{headerTitle || "Options"}</span>
            <span>{filtered.length} available</span>
          </div>

          {/* Options Scroll List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 font-medium">
                  {query ? `No matching options for "${query}".` : "No options available."}
                </p>
                {allowCustom && query.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(query.trim())}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <i className="ri-add-line" />
                    <span>Use "{query.trim()}"</span>
                  </button>
                )}
              </div>
            ) : (
              filtered.map((opt, i) => {
                const isSelected =
                  (value || "").toLowerCase() === opt.name.toLowerCase() ||
                  String(opt.id) === String(value);

                return (
                  <button
                    key={opt.id || i}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(opt.name)}
                    onMouseEnter={() => setHighlight(i)}
                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 text-blue-700 font-bold"
                        : i === highlight
                        ? "bg-slate-50 text-slate-900 font-semibold"
                        : "text-slate-700 hover:bg-slate-50/60 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <i className={opt.icon || icon} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs truncate">{opt.name}</span>
                        {opt.description && (
                          <span className="text-[10px] text-slate-400 truncate">{opt.description}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.code && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-600 font-semibold">
                          {opt.code}
                        </span>
                      )}
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-100">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <i className="ri-check-line text-blue-600 font-bold text-sm shrink-0 ml-1" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
