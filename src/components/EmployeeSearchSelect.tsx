import { useState, useEffect, useRef } from "react";

export interface SearchableEmployee {
  id: string;
  first_name: string;
  last_name: string;
  department?: string;
  role?: string;
  avatar_url?: string | null;
}

interface Props {
  employees: SearchableEmployee[];
  value: string;
  onChange: (employeeId: string) => void;
  placeholder?: string;
  excludeIds?: string[];
}

const initials = (first: string, last: string) => `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

/**
 * Searchable employee combobox — type to filter by name, department, or role;
 * pick with mouse or keyboard (↑/↓ + Enter, Esc to close). Reused by the
 * Leave request modal and the Shifts assign-employee modal.
 */
export default function EmployeeSearchSelect({
  employees,
  value,
  onChange,
  placeholder = "Search by name, department, or role...",
  excludeIds = [],
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const available = employees.filter((e) => !excludeIds.includes(e.id));
  const selected = available.find((e) => e.id === value) || null;

  const filtered = available.filter((e) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${e.first_name} ${e.last_name} ${e.department || ""} ${e.role || ""}`.toLowerCase().includes(q);
  });

  // Close when clicking anywhere outside the combobox.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Clear the search text whenever the selection is cleared externally
  // (e.g. a successful submit resets the parent's value to "").
  useEffect(() => {
    if (!value) setQuery("");
  }, [value]);

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          value={open ? query : selected ? `${selected.first_name} ${selected.last_name}` : query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
            if (!e.target.value) onChange("");
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setHighlight((h) => (filtered.length ? Math.min(h + 1, filtered.length - 1) : 0));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter") {
              const emp = filtered[highlight];
              if (emp) {
                e.preventDefault();
                onChange(emp.id);
                setQuery(`${emp.first_name} ${emp.last_name}`);
                setOpen(false);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-[#253C7D] bg-white"
        />
        <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {open && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
          <p className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            {filtered.length} employee{filtered.length === 1 ? "" : "s"}
            {query.trim() ? ` matching "${query.trim()}"` : ""}
          </p>
          {filtered.length === 0 ? (
            <p className="px-3 py-4 text-[12px] text-gray-400">No employees match your search.</p>
          ) : (
            filtered.map((emp, i) => {
              const isSelected = emp.id === value;
              return (
                <button
                  key={emp.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    onChange(emp.id);
                    setQuery(`${emp.first_name} ${emp.last_name}`);
                    setOpen(false);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${i === highlight ? "bg-gray-50" : ""}`}
                >
                  <span className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                    {emp.avatar_url ? (
                      <img src={emp.avatar_url} alt="" className="w-7 h-7 object-cover" />
                    ) : (
                      initials(emp.first_name, emp.last_name)
                    )}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] font-medium text-gray-900">{emp.first_name} {emp.last_name}</span>
                    <span className="block text-[11px] text-gray-400 truncate">
                      {emp.department}{emp.role ? ` · ${emp.role}` : ""}
                    </span>
                  </span>
                  {isSelected && <i className="ri-check-line text-[#253C7D] text-sm shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
