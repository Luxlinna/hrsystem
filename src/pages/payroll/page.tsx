import { PayrollHeader } from "./components/PayrollHeader";
import { PayrollStatsRow } from "./components/PayrollStatsRow";
import { PayrollChartsSection } from "./components/PayrollChartsSection";
import { PayrollFilterBar } from "./components/PayrollFilterBar";
import { PayrollTableView } from "./components/views/PayrollTableView";
import { PayrollCardsView } from "./components/views/PayrollCardsView";
import { PayslipModal } from "./components/modals/PayslipModal";
import { RecordModal } from "./components/modals/RecordModal";
import { BranchPayrollPolicyModal } from "./components/modals/BranchPayrollPolicyModal";
import { usePayroll } from "./hooks/usePayroll";
import { exportToCSV } from "./payrollUtils";

export default function Payroll() {
  const {
    canViewAll,
    isSuperAdmin,
    branches,
    targetBranch,
    isPartnerBranchBlocked,
    userBranchId,
    branchPolicy,
    allRecords,
    employees,
    loading,
    selectedMonth,
    setSelectedMonth,
    periodMode,
    setPeriodMode,
    searchQuery,
    setSearchQuery,
    filterDepartment,
    setFilterDepartment,
    filterStatus,
    setFilterStatus,
    viewMode,
    setViewMode,
    navigateMonth,
    filteredRecords,
    availableMonths,
    departments,
    stats,
    chartData,
    deptDistributionData,
    payslipModal,
    setPayslipModal,
    recordModal,
    setRecordModal,
    policyModalOpen,
    setPolicyModalOpen,
    savingRecord,
    savingPolicy,
    recordForm,
    setRecordForm,
    handleUpdateStatus,
    openRecordModal,
    handleSaveRecord,
    handleDeleteRecord,
    handleSavePolicy,
    isDark,
  } = usePayroll();

  const activeBranch = branches.find((b) => b.id === (targetBranch || userBranchId));
  const activeBranchName = activeBranch?.name;

  if (loading && allRecords.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-950">
        <div className="w-9 h-9 border-3 border-[#253C7D] dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
          Loading payroll management dashboard...
        </p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-5 sm:p-7 lg:p-8 font-sans">
        <PayrollHeader
          periodMode={periodMode}
          selectedMonth={selectedMonth}
          canViewAll={false}
          isSuperAdmin={isSuperAdmin}
          onExportCSV={() => {}}
          onOpenAddModal={() => {}}
        />
        <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 shadow-sm text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 text-3xl">
            <i className="ri-shield-keyhole-line" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Partner Branch Payroll Privacy Shield
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
            Each partner company branch operates with strictly confidential, isolated financial governance. Super Admins and users cannot access or view payroll and compensation records of other partner branches.
          </p>
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl text-rose-800 dark:text-rose-300 text-xs font-semibold text-left flex items-start gap-2.5">
            <i className="ri-lock-line text-base shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Access Restricted to Home Branch</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {userBranchId
                  ? `You are assigned to ${activeBranchName || "your home branch"}. Please switch back to your home branch in the header switcher to access payroll operations.`
                  : "You are not assigned to any branch. Please contact your company administrator to assign you to a branch."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <PayrollHeader
        periodMode={periodMode}
        selectedMonth={selectedMonth}
        canViewAll={canViewAll}
        branchName={activeBranchName}
        isSuperAdmin={isSuperAdmin}
        onExportCSV={() => exportToCSV(filteredRecords, periodMode, selectedMonth)}
        onOpenAddModal={() => openRecordModal(null)}
        onOpenPolicyModal={targetBranch ? () => setPolicyModalOpen(true) : undefined}
      />

      {/* KPI Stats Row */}
      <PayrollStatsRow
        stats={stats}
        filterStatus={filterStatus}
        onFilterStatus={setFilterStatus}
      />

      {/* Analytics Visualizations */}
      <PayrollChartsSection
        chartData={chartData}
        deptDistributionData={deptDistributionData}
        isDark={isDark}
      />

      {/* Filter and Period Selection Controls */}
      <PayrollFilterBar
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        periodMode={periodMode}
        setPeriodMode={setPeriodMode}
        availableMonths={availableMonths}
        departments={departments}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterDepartment={filterDepartment}
        setFilterDepartment={setFilterDepartment}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onNavigateMonth={navigateMonth}
      />

      {/* View 1: Table View */}
      {viewMode === "table" && (
        <PayrollTableView
          records={filteredRecords}
          canViewAll={canViewAll}
          onUpdateStatus={handleUpdateStatus}
          onOpenPayslip={setPayslipModal}
          onEditRecord={openRecordModal}
          onDeleteRecord={handleDeleteRecord}
        />
      )}

      {/* View 2: Cards View */}
      {viewMode === "cards" && (
        <PayrollCardsView
          records={filteredRecords}
          canViewAll={canViewAll}
          onUpdateStatus={handleUpdateStatus}
          onOpenPayslip={setPayslipModal}
          onEditRecord={openRecordModal}
          onDeleteRecord={handleDeleteRecord}
        />
      )}

      {/* Modals */}
      <PayslipModal
        record={payslipModal}
        onClose={() => setPayslipModal(null)}
      />

      <RecordModal
        isOpen={recordModal.open}
        onClose={() => setRecordModal({ open: false, record: null })}
        recordToEdit={recordModal.record}
        form={recordForm}
        setForm={setRecordForm}
        employees={employees}
        saving={savingRecord}
        onSubmit={handleSaveRecord}
      />

      <BranchPayrollPolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        policy={branchPolicy}
        branchName={activeBranchName}
        isSuperAdmin={isSuperAdmin}
        canManage={canViewAll}
        saving={savingPolicy}
        onSave={handleSavePolicy}
      />
    </div>
  );
}
