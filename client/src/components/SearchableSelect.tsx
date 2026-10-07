import React, { useState, useEffect, useRef, useMemo } from "react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

export interface SearchableSelectProps {
  options: Array<string | SearchableSelectOption>;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  buttonClassName?: string;
  showClear?: boolean;
  id?: string;
  name?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Type to search...",
  disabled = false,
  required = false,
  className = "w-full",
  buttonClassName,
  showClear = false,
  id,
  name,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize options to { value, label, sublabel, badge }
  const normalizedOptions = useMemo<SearchableSelectOption[]>(() => {
    return options.map((opt) => {
      if (typeof opt === "string") {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  const selectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value) || null;
  }, [normalizedOptions, value]);

  const filteredOptions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((opt) => {
      const matchLabel = (opt.label || "").toLowerCase().includes(q);
      const matchValue = (opt.value || "").toLowerCase().includes(q);
      const matchSub = (opt.sublabel || "").toLowerCase().includes(q);
      const matchBadge = (opt.badge || "").toLowerCase().includes(q);
      return matchLabel || matchValue || matchSub || matchBadge;
    });
  }, [normalizedOptions, searchQuery]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setHighlightIndex(0);
      setTimeout(() => searchInputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.children[highlightIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightIndex, isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        filteredOptions.length ? Math.min(prev + 1, filteredOptions.length - 1) : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = filteredOptions[highlightIndex];
      if (target) {
        handleSelect(target.value);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef} onKeyDown={handleKeyDown}>
      {/* Hidden input to support standard HTML form required validation */}
      {required && (
        <input
          type="text"
          id={id}
          name={name}
          value={value}
          required={required}
          readOnly
          className="sr-only"
          tabIndex={-1}
        />
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border rounded text-xs text-left transition-colors cursor-pointer ${
          disabled
            ? "opacity-60 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed text-slate-400"
            : isOpen
            ? "border-[#253C7D] ring-1 ring-[#253C7D] text-slate-900 dark:text-slate-100"
            : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200"
        } ${buttonClassName || ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`truncate ${!selectedOption ? "text-slate-400 dark:text-slate-500" : "font-medium"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {showClear && value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              title="Clear"
            >
              <i className="ri-close-line text-xs" />
            </span>
          )}
          <i
            className={`ri-arrow-down-s-line text-slate-400 transition-transform duration-150 ${
              isOpen ? "rotate-180 text-[#253C7D] dark:text-sky-400" : ""
            }`}
          />
        </div>
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-full min-w-[200px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1.5 text-xs animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Box */}
          <div className="px-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setHighlightIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-7 pr-7 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setHighlightIndex(0);
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <i className="ri-close-circle-fill text-xs" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div ref={listRef} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-slate-400 dark:text-slate-500">
                <i className="ri-search-line text-base block mb-1 opacity-50" />
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlightIndex;
                return (
                  <div
                    key={opt.value || idx}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightIndex(idx)}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-3 py-1.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#253C7D]/10 dark:bg-sky-950/60 text-[#253C7D] dark:text-sky-300 font-semibold"
                        : isHighlighted
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{opt.label}</span>
                        {opt.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-blue-50 text-[#253C7D] border border-blue-200/60 dark:bg-slate-800 dark:text-sky-300 dark:border-slate-700 shrink-0">
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {opt.sublabel && (
                        <span className="text-[10.5px] text-slate-400 dark:text-slate-500 truncate block">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <i className="ri-check-line text-sm text-[#253C7D] dark:text-sky-400 shrink-0" />
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
}
