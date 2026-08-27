import { memo, useState, useRef, useEffect } from "react";
import type { Employee } from "../../types";
import { initials } from "../../taskUtils";

interface TaskMultiAssigneeSelectProps {
  employees: Employee[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const TaskMultiAssigneeSelect = memo(function TaskMultiAssigneeSelect({
  employees,
  selectedIds,
  onChange,
}: TaskMultiAssigneeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter((e) =>
    `${e.first_name} ${e.last_name} ${e.department}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectedEmployees = employees.filter((e) => selectedIds.includes(e.id));

  const toggleEmployee = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const removeId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter((item) => item !== id));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === employees.length) {
      onChange([]);
    } else {
      onChange(employees.map((e) => e.id));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
        Assign To <span className="text-rose-500">*</span>
      </label>

      {/* Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] px-3 py-1.5 bg-gray-50/80 hover:bg-white border border-gray-200/80 rounded-2xl flex items-center justify-between gap-2 cursor-pointer transition-all shadow-2xs"
      >
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          {selectedEmployees.map((emp) => (
            <span
              key={emp.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-800 shadow-2xs"
            >
              <span className="w-4 h-4 rounded-full bg-[#253C7D] text-white text-[9px] flex items-center justify-center font-black">
                {initials(`${emp.first_name} ${emp.last_name}`)}
              </span>
              <span>{emp.first_name} {emp.last_name}</span>
              <button
                type="button"
                onClick={(e) => removeId(emp.id, e)}
                className="text-gray-400 hover:text-rose-500 ml-0.5 cursor-pointer"
              >
                <i className="ri-close-line text-xs" />
              </button>
            </span>
          ))}

          {selectedEmployees.length === 0 && (
            <span className="text-xs text-gray-400 font-medium">Select assignees...</span>
          )}
        </div>

        <i
          className={`ri-arrow-down-s-line text-gray-400 text-base transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#253C7D]" : ""
          }`}
        />
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200/90 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee..."
            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#253C7D]"
          />

          <button
            type="button"
            onClick={toggleSelectAll}
            className="w-full flex items-center gap-2 px-3 py-1 text-xs font-bold text-[#253C7D] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-b border-gray-100"
          >
            <i className="ri-checkbox-multiple-line" />
            <span>{selectedIds.length === employees.length ? "Deselect All" : `Select All (${employees.length})`}</span>
          </button>

          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {filteredEmployees.map((emp) => {
              const checked = selectedIds.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => toggleEmployee(emp.id)}
                  className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    checked ? "bg-[#253C7D]/10 text-[#253C7D]" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#253C7D]/15 text-[#253C7D] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {initials(`${emp.first_name} ${emp.last_name}`)}
                    </span>
                    <div className="truncate">
                      <p className="truncate font-bold">{emp.first_name} {emp.last_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{emp.department || "Staff"}</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] pointer-events-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
