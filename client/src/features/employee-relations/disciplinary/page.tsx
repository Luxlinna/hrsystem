import { useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";
import { useDisciplinary } from "./hooks/useDisciplinary";
import { DisciplinaryHeader } from "./components/DisciplinaryHeader";
import { WarningFilterBar } from "./components/WarningFilterBar";
import { DisciplinaryTableView } from "./components/DisciplinaryTableView";
import { WarningDetailModal } from "./components/WarningDetailModal";
import { CreateEmployeeWarningForm } from "./components/CreateEmployeeWarningForm";
import { Pagination } from "./components/Pagination";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

export default function DisciplinaryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const canViewEmployees = can("employees");
  const canViewChangeStatus = can("change-statuses") || can("movements") || can("employees");
  const canViewExits = can("exit") || can("employees");
  const canViewWarnings = can("warnings") || can("disciplinary") || can("employees");
  const canViewComplaints = can("complaints") || can("feedback") || can("employees");

  const {
    canManage, isSuperAdmin, userBranchName, activeBranchId, isPartnerBranchBlocked,
    employees, branches, loading, selectedRecord, setSelectedRecord,
    showModal, setShowModal, saving, newRecord, setNewRecord,
    filterType, setFilterType, filterStatus, setFilterStatus,
    searchQuery, setSearchQuery,
    filterDateOption, setFilterDateOption, startDate, setStartDate, endDate, setEndDate,
    pageSize, setPageSize,
    page, setPage, filteredRecords, totalPages,
    pagedRecords, handleCreateRecord, handleEditRecord,
    handleVoidRecord, handleDeleteRecord, openCreateModal,
    handleExportCSV,
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
          canManage={false}
          onOpenCreateModal={() => {}}
          canViewEmployees={canViewEmployees}
          canViewChangeStatus={canViewChangeStatus}
          canViewExits={canViewExits}
          canViewWarnings={canViewWarnings}
          canViewComplaints={canViewComplaints}
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
        canManage={canManage}
        onOpenCreateModal={openCreateModal}
        canViewEmployees={canViewEmployees}
        canViewChangeStatus={canViewChangeStatus}
        canViewExits={canViewExits}
        canViewWarnings={canViewWarnings}
        canViewComplaints={canViewComplaints}
      />

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 sm:p-6 space-y-4 shadow-2xs">
        {/* Warning Filter Bar with Date Filters (Presets + Custom) */}
        <WarningFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterType={filterType}
          setFilterType={setFilterType}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterDateOption={filterDateOption}
          setFilterDateOption={setFilterDateOption}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onExportCSV={handleExportCSV}
        />

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