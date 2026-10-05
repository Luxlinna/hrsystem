import { useState, useEffect, useRef } from "react";

export interface PositionOption {
  id: string;
  name: string;
  status?: string;
  tax_position?: string | null;
}

interface Props {
  positions: PositionOption[];
  value: string;
  onChange: (positionName: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function PositionSearchSelect({
  positions,
  value,
  onChange,
  placeholder = "Select or search position from Org...",
  required = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activePositions = positions.filter((p) => (p.status || "active") === "active");

  const filtered = activePositions.filter((p) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q);
  });

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

  const handleSelect = (posName: string) => {
    onChange(posName);
    setQuery("");
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger Button */}
      <div
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`w-full pl-8 pr-7 py-1.5 bg-slate-50/70 hover:bg-white border ${
          open ? "border-blue-500 ring-2 ring-blue-500/20 bg-white" : "border-slate-200"
        } rounded-xl text-xs font-semibold text-slate-800 transition-all cursor-pointer flex items-center justify-between select-none shadow-2xs`}
      >
        <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
          <i className="ri-briefcase-line" />
        </div>

        <span className={`truncate ${value ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}`}>
          {value || placeholder}
        </span>

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1">
          {value && (
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

      {/* Hidden input to satisfy form required constraint if needed */}
      {required && (
        <input
          type="text"
          value={value}
          onChange={() => {}}
          required
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Floating Searchable Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Inner Search Box */}
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
                    } else if (query.trim()) {
                      handleSelect(query.trim());
                    }
                  } else if (e.key === "Escape") {
                    setOpen(false);
                  }
                }}
                placeholder="Search position name..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* List Header */}
          <div className="px-3 py-1.5 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>Organization Positions</span>
            <span>{filtered.length} available</span>
          </div>

          {/* Positions Scroll List */}
          <div className="max-h-56 overflow-y-auto py-1 divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-slate-500 font-medium">No position matches "{query}".</p>
                {query.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelect(query.trim())}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <i className="ri-add-line" />
                    <span>Use "{query.trim()}" as custom title</span>
                  </button>
                )}
              </div>
            ) : (
              filtered.map((pos, i) => {
                const isSelected = value.toLowerCase() === pos.name.toLowerCase();
                return (
                  <button
                    key={pos.id || i}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(pos.name)}
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
                        <i className="ri-user-star-line" />
                      </div>
                      <span className="text-xs truncate">{pos.name}</span>
                    </div>

                    {isSelected && (
                      <i className="ri-check-line text-blue-600 font-bold text-sm shrink-0" />
                    )}
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
