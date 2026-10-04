import { useState, memo } from "react";
import { useNssf } from "../hooks/useNssf";
import { NssfImportModal } from "../components/NssfImportModal";
import { NssfTableRow } from "../components/NssfTableRow";
import { NssfToolbar } from "../components/NssfToolbar";
import { NssfMetricCards } from "../components/NssfMetricCards";
import { exportNssfXLSX } from "../exports/exportNssfXLSX";
import { exportNssfCSV } from "../exports/exportNssfCSV";

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
      <NssfMetricCards
        totalCount={employees.length}
        registeredCount={registeredCount}
        unregisteredCount={unregisteredCount}
      />

      {/* Toolbar */}
      <NssfToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onOpenImport={() => setImportModal(true)}
        onExportXLSX={handleExportXLSX}
        onExportCSV={handleExportCSV}
        exportLoading={exportLoading}
      />

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
