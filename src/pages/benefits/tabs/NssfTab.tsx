import { useState, memo } from "react";
import { useNssf } from "../hooks/useNssf";
import { NssfImportModal } from "../components/NssfImportModal";
import { exportNssfXLSX } from "../exports/exportNssfXLSX";
import { exportNssfCSV } from "../exports/exportNssfCSV";
import type { NssfEmployee } from "../types";

// Inline edit row
function NssfTableRow({
  emp,
  onSave,
  saving,
}: {
  emp: NssfEmployee;
  onSave: (id: string, updates: Partial<NssfEmployee>) => Promise<boolean>;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    nssf_number: emp.nssf_number || "",
    kh_name: emp.kh_name || "",
    nationality: emp.nationality || "Cambodian",
    gender: emp.gender || "",
    date_of_birth: emp.date_of_birth || "",
    basic_salary: emp.basic_salary != null ? String(emp.basic_salary) : "",
  });
  const [rowSaving, setRowSaving] = useState(false);

  const handleSave = async () => {
    setRowSaving(true);
    const ok = await onSave(emp.id, {
      nssf_number: form.nssf_number || null,
      kh_name: form.kh_name || null,
      nationality: form.nationality || null,
      gender: form.gender || null,
      date_of_birth: form.date_of_birth || null,
      basic_salary: form.basic_salary !== "" ? parseFloat(form.basic_salary) : null,
    });
    setRowSaving(false);
    if (ok) setEditing(false);
  };

  const isRegistered = !!emp.nssf_number;

  if (editing) {
    return (
      <tr className="bg-blue-50/30 border-b border-gray-100">
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2.5">
            {emp.avatar_url ? (
              <img src={emp.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#253C7D]/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-[#253C7D]">
                  {emp.first_name[0]}{emp.last_name[0]}
                </span>
              </div>
            )}
            <div>
              <p className="text-xs font-semibold text-gray-800">{emp.first_name} {emp.last_name}</p>
              <p className="text-[11px] text-gray-400">{emp.id}</p>
            </div>
          </div>
        </td>
        <td className="px-2 py-2">
          <input
            value={form.nssf_number}
            onChange={(e) => setForm((f) => ({ ...f, nssf_number: e.target.value }))}
            placeholder="NSSF Number"
            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </td>
        <td className="px-2 py-2">
          <input
            value={form.kh_name}
            onChange={(e) => setForm((f) => ({ ...f, kh_name: e.target.value }))}
            placeholder="ឈ្មោះខ្មែរ"
            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </td>
        <td className="px-2 py-2">
          <select
            value={form.gender}
            onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer"
          >
            <option value="">—</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </td>
        <td className="px-2 py-2">
          <input
            type="date"
            value={form.date_of_birth}
            onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </td>
        <td className="px-2 py-2 text-xs text-gray-500">{emp.join_date || "—"}</td>
        <td className="px-2 py-2">
          <input
            type="number"
            step="0.01"
            value={form.basic_salary}
            onChange={(e) => setForm((f) => ({ ...f, basic_salary: e.target.value }))}
            placeholder="0.00"
            className="w-full text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </td>
        <td className="px-2 py-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSave}
              disabled={rowSaving}
              className="flex items-center gap-1 px-2.5 py-1 bg-[#253C7D] text-white text-[11px] font-semibold rounded-lg hover:bg-[#1e3167] transition-colors cursor-pointer disabled:opacity-50"
            >
              {rowSaving ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <i className="ri-check-line" />}
              Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors group">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          {emp.avatar_url ? (
            <img src={emp.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#253C7D]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-[#253C7D]">
                {emp.first_name[0]}{emp.last_name[0]}
              </span>
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-gray-800">{emp.first_name} {emp.last_name}</p>
            <p className="text-[11px] text-gray-400">{emp.id}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5">
        {emp.nssf_number ? (
          <span className="text-xs font-mono text-gray-800">{emp.nssf_number}</span>
        ) : (
          <span className="text-[11px] text-orange-500 font-medium">Not Registered</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-xs text-gray-700">{emp.kh_name || <span className="text-gray-300">—</span>}</td>
      <td className="px-4 py-2.5">
        {emp.gender ? (
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${emp.gender === "Female" ? "bg-pink-100 text-pink-700" : "bg-blue-100 text-blue-700"}`}>
            {emp.gender}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-xs text-gray-600">{emp.date_of_birth || <span className="text-gray-300">—</span>}</td>
      <td className="px-4 py-2.5 text-xs text-gray-600">{emp.join_date || <span className="text-gray-300">—</span>}</td>
      <td className="px-4 py-2.5 text-xs text-gray-800 font-medium">
        {emp.basic_salary != null ? `$${Number(emp.basic_salary).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : <span className="text-gray-300">—</span>}
      </td>
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
              isRegistered ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"
            }`}
          >
            {isRegistered ? "Registered" : "Pending"}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-[#253C7D]/10 text-[#253C7D] cursor-pointer"
            title="Edit NSSF info"
          >
            <i className="ri-pencil-line text-xs" />
          </button>
        </div>
      </td>
    </tr>
  );
}

export const NssfTab = memo(function NssfTab() {
  const {
    filtered,
    loading,
    saving,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    importModal,
    setImportModal,
    saveEmployee,
    bulkImport,
    registeredCount,
    unregisteredCount,
    employees,
    migrationNeeded,
  } = useNssf();

  const [exportLoading, setExportLoading] = useState<"xlsx" | "csv" | null>(null);

  const handleExportXLSX = async () => {
    setExportLoading("xlsx");
    await exportNssfXLSX(filtered);
    setExportLoading(null);
  };

  const handleExportCSV = () => {
    setExportLoading("csv");
    exportNssfCSV(filtered);
    setExportLoading(null);
  };

  return (
    <div className="space-y-5">

      {/* Migration required banner */}
      {migrationNeeded && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <i className="ri-database-2-line text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900">Database Migration Required</p>
            <p className="text-xs text-amber-700 mt-0.5">
              The NSSF fields (nssf_number, gender, date_of_birth, etc.) are not yet in your database.
              Go to <strong>Supabase → SQL Editor</strong> and run the migration file:
              <code className="ml-1 bg-amber-100 px-1 rounded text-amber-800">20260915120000_nssf_management_enhancements.sql</code>
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Employees</p>
          <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">NSSF Registered</p>
          <p className="text-2xl font-bold text-green-600">{registeredCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Pending Registration</p>
          <p className="text-2xl font-bold text-orange-500">{unregisteredCount}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Coverage Rate</p>
          <p className="text-2xl font-bold text-[#253C7D]">
            {employees.length > 0 ? Math.round((registeredCount / employees.length) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-1 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, NSSF number…"
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-[#253C7D] bg-gray-50/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/60">
            {(["all", "registered", "unregistered"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all capitalize cursor-pointer ${
                  statusFilter === s ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {s === "all" ? "All" : s === "registered" ? "Registered" : "Pending"}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#253C7D] text-white text-xs font-semibold rounded-xl hover:bg-[#1e3167] transition-colors cursor-pointer shadow-xs"
          >
            <i className="ri-upload-cloud-2-line" />
            Import
          </button>

          <button
            onClick={handleExportXLSX}
            disabled={exportLoading === "xlsx"}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {exportLoading === "xlsx" ? (
              <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <i className="ri-file-excel-2-line text-green-600" />
            )}
            Excel
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exportLoading === "csv"}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {exportLoading === "csv" ? (
              <span className="w-3 h-3 border border-gray-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <i className="ri-file-text-line text-blue-500" />
            )}
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Loading NSSF data…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <i className="ri-shield-user-line text-2xl text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-500">No employees found</p>
            <p className="text-xs text-gray-400">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Employee</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">NSSF No.</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Name (KH)</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Gender</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Date of Birth</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Join Date</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Salary (USD)</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <NssfTableRow key={emp.id} emp={emp} onSave={saveEmployee} saving={saving} />
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-gray-100 text-[11px] text-gray-400">
              Showing {filtered.length} of {employees.length} employees
            </div>
          </div>
        )}
      </div>

      <NssfImportModal
        isOpen={importModal}
        onClose={() => setImportModal(false)}
        onImport={bulkImport}
        saving={saving}
      />
    </div>
  );
});
