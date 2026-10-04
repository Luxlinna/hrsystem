import { useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDisciplinary } from "./hooks/useDisciplinary";
import { DisciplinaryHeader } from "./components/DisciplinaryHeader";
import { DisciplinaryTableView } from "./components/DisciplinaryTableView";
import { WarningDetailModal } from "./components/WarningDetailModal";
import { CreateEmployeeWarningForm } from "./components/CreateEmployeeWarningForm";
import { useWarningPermission } from "./hooks/useWarningPermission";
import { Pagination } from "./components/Pagination";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

export default function DisciplinaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canManageWarningSettings } = useWarningPermission();

  const {
    canManage, isSuperAdmin, userBranchName, activeBranchId, isPartnerBranchBlocked,
    employees, branches, loading, selectedRecord, setSelectedRecord,
    showModal, setShowModal, saving, newRecord, setNewRecord,
    filterType, setFilterType, filterStatus, setFilterStatus,
    searchQuery, setSearchQuery, pageSize, setPageSize,
    page, setPage, filteredRecords, totalPages,
    pagedRecords, handleCreateRecord, handleEditRecord,
    handleVoidRecord, handleDeleteRecord, openCreateModal,
  } = useDisciplinary();

  useEffect(() => {
    if (location.pathname.endsWith("/create") && !showModal) {
      openCreateModal();
    }
  }, [location.pathname, showModal, openCreateModal]);

  const handleCloseCreate = useCallback(() => {
    setShowModal(false);
    if (location.pathname.endsWith("/create")) {
      navigate("/disciplinary");
    }
  }, [location.pathname, navigate, setShowModal]);

  if (loading && filteredRecords.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading warning records...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <DisciplinaryHeader
          recordsCount={0}
          canManage={false}
          onOpenCreateModal={() => {}}
          canManageSettings={canManageWarningSettings}
          onOpenSettings={() => navigate("/warnings/settings")}
        />
        <PartnerBranchPrivacyShield
          moduleName="Employee Warnings"
          userBranchName={userBranchName}
          hasNoBranch={false}
        />
      </div>
    );
  }

  if (showModal) {
    return (
      <CreateEmployeeWarningForm
        onBack={handleCloseCreate}
        employees={employees}
        branches={branches}
        newRecord={newRecord}
        setNewRecord={setNewRecord}
        saving={saving}
        isSuperAdmin={isSuperAdmin}
        activeBranchId={activeBranchId}
        onSubmit={async (e) => {
          if (e && typeof e.preventDefault === "function") {
            e.preventDefault();
          }
          const ok = await handleCreateRecord(newRecord);
          if (ok) handleCloseCreate();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      <DisciplinaryHeader
        recordsCount={filteredRecords.length}
        canManage={canManage}
        onOpenCreateModal={openCreateModal}
        records={filteredRecords}
        canManageSettings={canManageWarningSettings}
        onOpenSettings={() => navigate("/warnings/settings")}
      />

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center w-full sm:w-80">
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 border border-r-0 border-slate-300 rounded-l-md text-xs focus:outline-none focus:border-sky-500"
            />
            <button
              type="button"
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-r-md text-xs transition-colors cursor-pointer"
            >
              <i className="ri-search-line" />
            </button>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-xs text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="">Warning Type</option>
              <option value="First Written">First Written</option>
              <option value="Second Written">Second Written</option>
              <option value="Final Warning">Final Warning</option>
              <option value="Verbal">Verbal</option>
              <option value="Instruction">Instruction</option>
              <option value="Notice">Notice</option>
              <option value="Suspense">Suspense</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-md text-xs text-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="">Status</option>
              <option value="Recorded">Recorded</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Warning Records Table */}
        <DisciplinaryTableView
          records={pagedRecords}
          onSelectRecord={setSelectedRecord}
          onEditRecord={canManage ? handleEditRecord : undefined}
          onVoidRecord={canManage ? handleVoidRecord : undefined}
          onDeleteRecord={canManage ? handleDeleteRecord : undefined}
        />

        {filteredRecords.length > 0 && (
          <div className="pt-2">
            <Pagination
              totalCount={filteredRecords.length}
              pageSize={pageSize}
              setPageSize={setPageSize}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
            />
          </div>
        )}
      </div>

      <WarningDetailModal
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onDelete={canManage ? handleDeleteRecord : undefined}
      />
    </div>
  );
}