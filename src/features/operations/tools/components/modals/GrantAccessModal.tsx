import { memo } from "react";
import type { Tool, Employee } from "../../types";
import { initials } from "../../toolsUtils";

interface GrantAccessModalProps {
  open: boolean;
  tool: Tool | null;
  employees: Employee[];
  departments: string[];
  assignEmployeeIds: string[];
  setAssignEmployeeIds: React.Dispatch<React.SetStateAction<string[]>>;
  assignSearch: string;
  setAssignSearch: (s: string) => void;
  assignDeptFilter: string;
  setAssignDeptFilter: (d: string) => void;
  saving: boolean;
  onGrant: () => void;
  onClose: () => void;
}

export const GrantAccessModal = memo(function GrantAccessModal({
  open,
  tool,
  employees,
  departments,
  assignEmployeeIds,
  setAssignEmployeeIds,
  assignSearch,
  setAssignSearch,
  assignDeptFilter,
  setAssignDeptFilter,
  saving,
  onGrant,
  onClose,
}: GrantAccessModalProps) {
  if (!open || !tool) return null;

  const filteredEmployees = employees.filter((e) => {
    if (assignDeptFilter !== "All" && e.department !== assignDeptFilter) return false;
    if (assignSearch.trim()) {
      const q = assignSearch.toLowerCase().trim();
      const name = `${e.first_name} ${e.last_name}`.toLowerCase();
      const role = (e.role || "").toLowerCase();
      return name.includes(q) || role.includes(q);
    }
    return true;
  });

  const toggleEmployee = (id: string) => {
    setAssignEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setAssignEmployeeIds(filteredEmployees.map((e) => e.id));
  };

  const clearAll = () => {
    setAssignEmployeeIds([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">Grant Tool Permissions</h3>
            <p className="text-xs text-gray-500">
              Provisioning access for: <span className="font-semibold text-gray-800">{tool.name}</span>
            </p>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={assignSearch}
              onChange={(e) => setAssignSearch(e.target.value)}
              placeholder="Search staff..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <select
            value={assignDeptFilter}
            onChange={(e) => setAssignDeptFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === "All" ? "All Depts" : d}
              </option>
            ))}
          </select>
        </div>

        {/* Quick batch selectors */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span>
            Selected: <strong className="text-gray-900">{assignEmployeeIds.length}</strong> staff
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="text-[#253C7D] hover:underline font-semibold cursor-pointer"
            >
              Select All ({filteredEmployees.length})
            </button>
            <span>&middot;</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Employee checkboxes list */}
        <div className="flex-1 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50 max-h-60 p-1">
          {filteredEmployees.map((emp) => {
            const isSelected = assignEmployeeIds.includes(emp.id);
            const empName = `${emp.first_name} ${emp.last_name}`;

            return (
              <div
                key={emp.id}
                onClick={() => toggleEmployee(emp.id)}
                className={`p-2.5 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  isSelected ? "bg-blue-50/50" : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {emp.avatar_url ? (
                    <img
                      src={emp.avatar_url}
                      alt={empName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#253C7D] text-white text-[9px] font-bold flex items-center justify-center">
                      {initials(emp.first_name, emp.last_name)}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{empName}</p>
                    <p className="text-[10px] text-gray-400">
                      {emp.department || "General"} &middot; {emp.role || "Staff"}
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] pointer-events-none"
                />
              </div>
            );
          })}
        </div>

        {/* Modal actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onGrant}
            disabled={saving || assignEmployeeIds.length === 0}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#253C7D] hover:bg-[#1F336A] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Grant Permissions ({assignEmployeeIds.length})
          </button>
        </div>
      </div>
    </div>
  );
});
