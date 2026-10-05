import { useState, useRef, useEffect, useMemo } from "react";
import type { Employee } from "../../types";

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
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    if (!search.trim()) return availableEmployees;
    const q = search.toLowerCase();
    return availableEmployees.filter((e) => {
      const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
      const role = (e.role || "").toLowerCase();
      const dept = (e.department || "").toLowerCase();
      const code = (e.employee_code || "").toLowerCase();
      return name.includes(q) || role.includes(q) || dept.includes(q) || code.includes(q);
    });
  }, [availableEmployees, search]);

  const handleConfirmAdd = (empToAdd?: Employee) => {
    const target = empToAdd || selectedEmp;
    if (!target) return;
    onAddApprover(target);
    setSelectedEmp(null);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-2 pt-1 relative z-30" ref={dropdownRef}>
      {/* Combobox Trigger */}
      <div className="flex-1 relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-left text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#3b82f6] flex items-center justify-between gap-2 cursor-pointer shadow-2xs hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-all"
        >
          <span className="truncate font-medium">
            {selectedEmp
              ? `${selectedEmp.first_name} ${selectedEmp.last_name} (${selectedEmp.role || selectedEmp.department || "Staff"})`
              : "Search & select employee to add..."}
          </span>
          <i className={`ri-arrow-down-s-line text-gray-400 text-sm shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Dropdown Menu (Opens downward with prominent search input and scrollable list) */}
        {isOpen && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-100">
            {/* Search Input Box */}
            <div className="p-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/50 shrink-0">
              <div className="relative">
                <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type name, role, or department..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-7 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:border-[#3b82f6] shadow-2xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer p-0.5"
                  >
                    <i className="ri-close-circle-line" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Employee List */}
            <div className="overflow-y-auto max-h-52 p-1 divide-y divide-gray-50 dark:divide-slate-800 overscroll-contain">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  <i className="ri-user-unfollow-line text-lg mb-1 block text-gray-300" />
                  No employees found matching &ldquo;{search}&rdquo;
                </div>
              ) : (
                filtered.map((e) => {
                  const isSelected = selectedEmp?.id === e.id;
                  const name = `${e.first_name || ""} ${e.last_name || ""}`.trim();
                  return (
                    <div
                      key={e.id}
                      onClick={() => {
                        setSelectedEmp(e);
                        handleConfirmAdd(e);
                      }}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer text-xs transition-colors ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 font-bold"
                          : "hover:bg-blue-50/60 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {e.avatar_url ? (
                          <img
                            src={e.avatar_url}
                            alt={name}
                            className="w-7 h-7 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-[#253C7D] dark:text-sky-300 font-extrabold text-[11px] flex items-center justify-center shrink-0 border border-gray-200/60">
                            {e.first_name?.[0] || "E"}
                          </div>
                        )}
                        <div className="truncate">
                          <span className="font-bold text-gray-800 dark:text-slate-100">{name}</span>
                          <span className="text-[10.5px] text-gray-400 ml-1.5 font-normal">
                            ({e.role || e.department || "Staff"})
                          </span>
                        </div>
                      </div>
                      <i className="ri-user-add-line text-xs text-sky-600 opacity-0 group-hover:opacity-100 shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={() => handleConfirmAdd()}
        disabled={!selectedEmp}
        className="px-3.5 py-2 bg-[#3b82f6] disabled:bg-gray-200 dark:disabled:bg-slate-800 hover:bg-blue-600 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 shadow-2xs"
      >
        <i className="ri-user-add-line text-xs" />
        <span>Add</span>
      </button>
    </div>
  );
}
