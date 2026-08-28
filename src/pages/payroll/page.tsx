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

  const activeBranch = branches.find((b) => b.id === targetBranch);
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
