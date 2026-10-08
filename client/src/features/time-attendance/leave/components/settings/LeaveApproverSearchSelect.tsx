import { useState, useRef, useEffect, useMemo } from "react";
import type { Employee } from "../../types";
import { getLeaveEmployeeName, getLeaveEmployeeInitials } from "../../utils/leaveDisplayUtils";

interface LeaveApproverSearchSelectProps {
  availableEmployees: Employee[];
  onAddApprover: (emp: Employee) => void;
}

export function LeaveApproverSearchSelect({
  availableEmployees,
  onAddApprover,
}: LeaveApproverSearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter out super admin accounts from selection
  const cleanEmployees = useMemo(() => {
    return availableEmployees.filter((e) => {
      const r = (e.role || "").toLowerCase();
      const n = getLeaveEmployeeName(e).toLowerCase();
      return !(r.includes("super admin") || r.includes("superadmin") || n.includes("superadmin"));
    });
  }, [availableEmployees]);

  const filtered = useMemo(() => {
    if (!search.trim()) return cleanEmployees;
    const q = search.toLowerCase().trim();
    return cleanEmployees.filter((e) => {
      const name = getLeaveEmployeeName(e).toLowerCase();
      const firstLast = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
      const role = (e.role || "").toLowerCase();
      const dept = (e.department || "").toLowerCase();
      const code = (e.employee_code || "").toLowerCase();
      return name.includes(q) || firstLast.includes(q) || role.includes(q) || dept.includes(q) || code.includes(q);
    });
  }, [cleanEmployees, search]);

  const handleSelectEmployee = (emp: Employee) => {
    onAddApprover(emp);
    setSearch("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && filtered.length > 0) {
      e.preventDefault();
      handleSelectEmployee(filtered[0]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative z-30 pt-1" ref={containerRef}>
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
          <i className="ri-search-line text-sm" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={search}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search employee by name, role, or department to add..."
          className="w-full pl-9 pr-24 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#0088cc] focus:border-[#0088cc] focus:ring-2 focus:ring-[#0088cc]/15 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 transition-all outline-none shadow-2xs"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition-colors cursor-pointer text-xs"
              title="Clear search"
            >
              <i className="ri-close-circle-fill text-sm" />
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              if (!isOpen) inputRef.current?.focus();
            }}
            className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>{cleanEmployees.length} staff</span>
            <i
              className={`ri-arrow-down-s-line text-xs transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Floating Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header pill */}
          <div className="px-3.5 py-2 bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-semibold">
            <span>
              {search.trim()
                ? `Search results (${filtered.length})`
                : `Select an approver (${filtered.length} available)`}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              Click to add to step
            </span>
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-64 p-1.5 divide-y divide-slate-50 dark:divide-slate-800/60 overscroll-contain">
            {filtered.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 text-lg">
                  <i className="ri-user-search-line" />
                </div>
                <div>
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    No employees found
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {search ? `No match for "${search}"` : "All employees are already added"}
                  </p>
                </div>
              </div>
            ) : (
              filtered.map((e) => {
                const name = getLeaveEmployeeName(e);
                const initial = getLeaveEmployeeInitials(e);
                return (
                  <div
                    key={e.id}
                    onClick={() => handleSelectEmployee(e)}
                    className="p-2.5 rounded-xl flex items-center justify-between cursor-pointer text-xs transition-all hover:bg-sky-50/80 dark:hover:bg-slate-800/90 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {e.avatar_url ? (
                        <img
                          src={e.avatar_url}
                          alt={name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-[#0088cc] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0088cc] transition-colors truncate">
                            {name}
                          </span>
                          {e.department && (
                            <span className="px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 uppercase tracking-wide">
                              {e.department}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                          {e.role || "Staff Member"}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center">
                      <span className="px-2.5 py-1 rounded-lg bg-[#0088cc] text-white text-[11px] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 shadow-2xs transition-all transform group-hover:translate-x-0 translate-x-1">
                        <i className="ri-add-line text-xs" />
                        <span>Add</span>
                      </span>
                    </div>
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
