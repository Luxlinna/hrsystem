import { memo, useRef, useEffect } from "react";
import type { SearchResult } from "./types";

interface GlobalSearchProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: SearchResult[];
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchLoading: boolean;
  onSelectResult: (result: SearchResult) => void;
  onClear: () => void;
}

/**
 * Global search bar + results dropdown.
 *
 * React.memo'd — re-renders only when search state changes, not on notification
 * badge updates, profile open/close, etc.
 *
 * Also exports `focusSearch` imperative handle so TopBar can wire up Cmd+K.
 */
const GlobalSearch = memo(function GlobalSearch({
  searchQuery,
  setSearchQuery,
  searchResults,
  searchOpen,
  setSearchOpen,
  searchLoading,
  onSelectResult,
  onClear,
}: GlobalSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = [
    // local focused state — doesn't need to bubble up
    // Using a module-local state pattern via useRef trick for performance:
    // "focused" only affects the search icon colour, no parent re-render needed.
    false,
    (_: boolean) => {},
  ];

  // Expose focus method via a data attribute so TopBar can call it via ref
  useEffect(() => {
    if (!containerRef.current) return;
    (containerRef.current as any).__focusSearch = () => inputRef.current?.focus();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setSearchOpen]);

  const CATEGORIES = ["Employee", "Candidate", "Module"] as const;

  return (
    <div className="flex-1 min-w-0 max-w-xs lg:max-w-md mx-1 sm:mx-3 md:mx-4" ref={containerRef}>
      <div className="relative">
        {/* Search icon */}
        <i className={`ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
          searchQuery ? "text-[#253C7D] dark:text-sky-400" : "text-gray-400 dark:text-slate-500"
        } pointer-events-none`} />

        <input
          ref={inputRef}
          id="topbar-search"
          type="text"
          placeholder="Search employees, modules…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
          className="w-full pl-9 pr-9 py-2 rounded-lg text-[12px] transition-all outline-none bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-[#253C7D]/30 dark:focus:border-sky-500/40"
        />

        {/* Clear button */}
        {searchQuery && (
          <button
            onClick={() => { onClear(); inputRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-slate-400 dark:hover:text-slate-200 w-4 h-4 flex items-center justify-center cursor-pointer"
            aria-label="Clear search"
          >
            <i className="ri-close-line text-sm" />
          </button>
        )}

        {/* Loading spinner */}
        {searchLoading && (
          <span className="absolute right-8 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-[#253C7D]/40 dark:border-sky-400/40 border-t-[#253C7D] dark:border-t-sky-400 rounded-full animate-spin" />
        )}

        {/* Results dropdown */}
        {searchOpen && searchResults.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50 max-h-[380px] overflow-y-auto shadow-xl"
          >
            {CATEGORIES.map((category) => {
              const catResults = searchResults.filter((r) => r.category === category);
              if (catResults.length === 0) return null;
              return (
                <div key={category}>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/80 border-b border-gray-100 dark:border-slate-800">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      {category}s
                    </span>
                  </div>
                  {catResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => onSelectResult(result)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#253C7D]/5 dark:hover:bg-slate-800/70 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 dark:bg-sky-950/60 flex items-center justify-center shrink-0">
                        <i className={`${result.icon} text-[#253C7D] dark:text-sky-400 text-sm`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-gray-900 dark:text-slate-100 truncate">{result.label}</p>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{result.sublabel}</p>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-850">
              <p className="text-[10px] text-gray-400 dark:text-slate-500">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* No-results state */}
        {searchOpen && searchResults.length === 0 && searchQuery.trim().length >= 1 && !searchLoading && (
          <div
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 p-5 text-center z-50 shadow-xl"
          >
            <i className="ri-search-line text-2xl text-gray-300 dark:text-slate-600 mb-2 block" />
            <p className="text-[12px] text-gray-500 dark:text-slate-400">No results for &ldquo;{searchQuery}&rdquo;</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default GlobalSearch;
