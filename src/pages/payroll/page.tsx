import { PayrollHeader } from "./components/PayrollHeader";
import { PayrollStatsRow } from "./components/PayrollStatsRow";
import { PayrollChartsSection } from "./components/PayrollChartsSection";
import { PayrollFilterBar } from "./components/PayrollFilterBar";
import { PayrollTableView } from "./components/views/PayrollTableView";
import { PayrollCardsView } from "./components/views/PayrollCardsView";
import { PayrollModalsContainer } from "./components/modals/PayrollModalsContainer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { usePayroll } from "./hooks/usePayroll";
import { exportToCSV } from "./payrollUtils";

export default function Payroll() {
  const p = usePayroll();

  const activeBranch = p.branches.find((b) => b.id === (p.targetBranch || p.userBranchId));
  const activeBranchName = activeBranch?.name;

  if (p.loading && p.allRecords.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-950">
        <div className="w-9 h-9 border-3 border-[#253C7D] dark:border-sky-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500 dark:text-slate-400">
          Loading payroll management dashboard...
        </p>
      </div>
    );
  }

  if (p.isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-5 sm:p-7 lg:p-8 font-sans">
        <PayrollHeader
          periodMode={p.periodMode}
          selectedMonth={p.selectedMonth}
          canViewAll={false}
          isSuperAdmin={p.isSuperAdmin}
          onExportCSV={() => {}}
          onOpenAddModal={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Payroll & Compensation"
          userBranchName={activeBranchName}
          hasNoBranch={!p.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-5 sm:p-7 lg:p-8 font-sans">
      <PayrollHeader
        periodMode={p.periodMode}
        selectedMonth={p.selectedMonth}
        canViewAll={p.canViewAll}
        branchName={activeBranchName}
        isSuperAdmin={p.isSuperAdmin}
        onExportCSV={() => exportToCSV(p.filteredRecords, p.periodMode, p.selectedMonth)}
        onOpenAddModal={() => p.openRecordModal(null)}
        onOpenPolicyModal={p.targetBranch ? () => p.setPolicyModalOpen(true) : undefined}
      />

      <PayrollStatsRow
        stats={p.stats}
        filterStatus={p.filterStatus}
        onFilterStatus={p.setFilterStatus}
      />

      <PayrollChartsSection
        chartData={p.chartData}
        deptDistributionData={p.deptDistributionData}
        isDark={p.isDark}
      />

      <PayrollFilterBar
        selectedMonth={p.selectedMonth}
        setSelectedMonth={p.setSelectedMonth}
        periodMode={p.periodMode}
        setPeriodMode={p.setPeriodMode}
        availableMonths={p.availableMonths}
        departments={p.departments}
        searchQuery={p.searchQuery}
        setSearchQuery={p.setSearchQuery}
        filterDepartment={p.filterDepartment}
        setFilterDepartment={p.setFilterDepartment}
        filterStatus={p.filterStatus}
        setFilterStatus={p.setFilterStatus}
        viewMode={p.viewMode}
        setViewMode={p.setViewMode}
        onNavigateMonth={p.navigateMonth}
      />

      {p.viewMode === "table" && (
        <PayrollTableView
          records={p.filteredRecords}
          canViewAll={p.canViewAll}
          onUpdateStatus={p.handleUpdateStatus}
          onOpenPayslip={p.setPayslipModal}
          onEditRecord={p.openRecordModal}
          onDeleteRecord={p.handleDeleteRecord}
        />
      )}

      {p.viewMode === "cards" && (
        <PayrollCardsView
          records={p.filteredRecords}
          canViewAll={p.canViewAll}
          onUpdateStatus={p.handleUpdateStatus}
          onOpenPayslip={p.setPayslipModal}
          onEditRecord={p.openRecordModal}
          onDeleteRecord={p.handleDeleteRecord}
        />
      )}

      <PayrollModalsContainer
        {...p}
        activeBranchName={activeBranchName}
      />
    </div>
  );
}
