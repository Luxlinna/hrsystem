import { useState, useMemo } from "react";
import { EmployeeLevelActionMenu } from "./EmployeeLevelActionMenu";
import { EmployeeLevelStatusFilter } from "./EmployeeLevelStatusFilter";
import type { EmployeeLevel } from "../../types";

interface EmployeeLevelsTableProps {
  employeeLevels: EmployeeLevel[];
  loading: boolean;
  canManage?: boolean;
  onCreateNew: () => void;
  onView: (item: EmployeeLevel) => void;
  onEdit: (item: EmployeeLevel) => void;
  onToggleStatus: (item: EmployeeLevel) => void;
  onDelete: (item: EmployeeLevel) => void;
}

type SortField = "name" | "remark" | "status" | "sort_order";
type SortDirection = "asc" | "desc";

export function EmployeeLevelsTable({
  employeeLevels,
  loading,
  canManage = true,
  onCreateNew,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: EmployeeLevelsTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [sortField, setSortField] = useState<SortField>("sort_order");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...employeeLevels];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((t) => (t.status || "active") === statusFilter);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.remark?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortField === "name") {
        valA = a.name || "";
        valB = b.name || "";
      } else if (sortField === "remark") {
        valA = a.remark || "";
        valB = b.remark || "";
      } else if (sortField === "status") {
        valA = a.status || "";
        valB = b.status || "";
      } else if (sortField === "sort_order") {
        valA = a.sort_order ?? 0;
        valB = b.sort_order ?? 0;
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return result;
  }, [employeeLevels, search, statusFilter, sortField, sortDirection]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
      {/* Top Bar with Title and Create Button */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Employee Levels
        </h2>
        {canManage && (
          <button
            type="button"
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#2b8de3] hover:bg-[#2272b8] text-white text-xs font-semibold rounded shadow-2xs cursor-pointer transition-colors"
          >
            <i className="ri-add-circle-line text-sm" />
            <span>Create New Employee Level</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Search input with blue magnifying glass icon */}
        <div className="relative flex items-center max-w-sm w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full pl-3 pr-10 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-l text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
          />
          <button
            type="button"
            className="px-3 py-1.5 bg-[#2b8de3] text-white rounded-r border border-[#2b8de3] flex items-center justify-center cursor-pointer hover:bg-[#2272b8] transition-colors"
          >
            <i className="ri-search-line text-xs" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <EmployeeLevelStatusFilter
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold bg-slate-50/50 dark:bg-slate-900/50">
              <th className="py-3 px-6 w-16">No.</th>
              <th
                onClick={() => handleSort("name")}
                className="py-3 px-6 cursor-pointer select-none hover:text-[#2b8de3] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Employee level name</span>
                  <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
                </div>
              </th>
              <th
                onClick={() => handleSort("remark")}
                className="py-3 px-6 cursor-pointer select-none hover:text-[#2b8de3] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Remark</span>
                  <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
                </div>
              </th>
              <th
                onClick={() => handleSort("status")}
                className="py-3 px-6 cursor-pointer select-none hover:text-[#2b8de3] transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status</span>
                  <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
                </div>
              </th>
              <th className="py-3 px-6 text-right w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#2b8de3] border-t-transparent rounded-full animate-spin" />
                    <span>Loading employee levels...</span>
                  </div>
                </td>
              </tr>
            ) : filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400 font-normal">
                  No records found
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((item, index) => {
                const isDisabled = item.status === "disabled";
                return (
                  <tr
                    key={item.id || index}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-6 font-normal text-slate-600 dark:text-slate-400">
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex flex-col items-start gap-1">
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {item.name}
                        </span>
                        {isDisabled && (
                          <span className="inline-block px-1.5 py-0.5 bg-[#f0ad4e] text-white text-[9.5px] font-semibold rounded leading-none shadow-2xs">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400">
                      {item.remark || "—"}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                          isDisabled
                            ? "bg-[#f0ad4e] text-white"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400"
                        }`}
                      >
                        {isDisabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {canManage && (
                        <EmployeeLevelActionMenu
                          employeeLevel={item}
                          onView={onView}
                          onEdit={onEdit}
                          onToggleStatus={onToggleStatus}
                          onDelete={onDelete}
                        />
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
