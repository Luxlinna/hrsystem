import { useAnalytics } from "./hooks/useAnalytics";
import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { MetricCards } from "./components/MetricCards";
import { AnalyticsNavTabs } from "./components/AnalyticsNavTabs";
import { OverviewTab } from "./tabs/OverviewTab";
import { LeaveTab } from "./tabs/LeaveTab";
import { PayrollTab } from "./tabs/PayrollTab";
import { HiringTab } from "./tabs/HiringTab";
import { OffboardingTab } from "./tabs/OffboardingTab";
import { ITTab } from "./tabs/ITTab";
import { FinanceTab } from "./tabs/FinanceTab";
import { BenefitsTab } from "./tabs/BenefitsTab";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

export default function Analytics() {
  const {
    activeTab,
    setActiveTab,
    department,
    setDepartment,
    data,
    aggregations,
    exporter,
  } = useAnalytics();

  if (data.isPartnerBranchBlocked) {
    return (
      <div className="p-6 lg:p-10 min-h-screen bg-white">
        <PartnerBranchPrivacyShield
          moduleName="Analytics Dashboard"
          userBranchName={data.userBranchName}
          hasNoBranch={!data.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      {/* Header with department filter and export dropdown */}
      <AnalyticsHeader
        department={department}
        setDepartment={setDepartment}
        departments={aggregations.departments}
        exporting={exporter.exporting}
        exportOpen={exporter.exportOpen}
        setExportOpen={exporter.setExportOpen}
        onExport={exporter.handleExport}
      />

      {/* Top 8 metric tiles */}
      <MetricCards
        totalEmployees={aggregations.totalEmployees}
        activeEmployees={aggregations.activeEmployees}
        avgTenure={aggregations.avgTenure}
        openJobsCount={data.jobs.filter((j) => j.status === "active").length}
        candidatesCount={data.candidates.length}
        pendingLeaveCount={data.leaveRequests.filter((l) => l.status === "pending").length}
        activeOffboardingCount={data.offboarding.filter((o) => o.status !== "completed").length}
        openTickets={aggregations.openTickets}
        assignedAssets={aggregations.assignedAssets}
        totalAssets={data.itAssets.length}
        totalExpense={aggregations.totalExpense}
      />

      {/* Tab bar */}
      <AnalyticsNavTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab Panels */}
      {activeTab === "overview" && (
        <OverviewTab
          deptDistribution={aggregations.deptDistribution}
          statusBreakdown={aggregations.statusBreakdown}
          department={department}
          departments={aggregations.departments}
          employees={data.employees}
          filteredEmps={aggregations.filteredEmps}
          jobs={data.jobs}
          payroll={data.payroll}
        />
      )}

      {activeTab === "leave" && (
        <LeaveTab
          leaveByDept={aggregations.leaveByDept}
          leaveByType={aggregations.leaveByType}
          leaveRequests={data.leaveRequests}
          empMap={aggregations.empMap}
          department={department}
        />
      )}

      {activeTab === "payroll" && (
        <PayrollTab
          salaryByDept={aggregations.salaryByDept}
          payroll={data.payroll}
          empMap={aggregations.empMap}
          department={department}
        />
      )}

      {activeTab === "hiring" && (
        <HiringTab
          hiringByDept={aggregations.hiringByDept}
          candidates={data.candidates}
        />
      )}

      {activeTab === "offboarding" && (
        <OffboardingTab
          offboarding={data.offboarding}
          offboardingByReason={aggregations.offboardingByReason}
          offboardingByStatus={aggregations.offboardingByStatus}
        />
      )}

      {activeTab === "it" && (
        <ITTab
          itAssets={data.itAssets}
          assignedAssets={aggregations.assignedAssets}
          openTickets={aggregations.openTickets}
          itAssetsByType={aggregations.itAssetsByType}
          itAssetsByStatus={aggregations.itAssetsByStatus}
          ticketsByPriority={aggregations.ticketsByPriority}
          ticketsByStatus={aggregations.ticketsByStatus}
        />
      )}

      {activeTab === "finance" && (
        <FinanceTab
          expenses={data.expenses}
          totalExpense={aggregations.totalExpense}
          paidExpense={aggregations.paidExpense}
          expenseByCategory={aggregations.expenseByCategory}
          expenseByStatus={aggregations.expenseByStatus}
        />
      )}

      {activeTab === "benefits" && (
        <BenefitsTab
          benefitPlans={data.benefitPlans}
          benefitEnrollments={data.benefitEnrollments}
          employees={data.employees}
          benefitEnrollmentByPlan={aggregations.benefitEnrollmentByPlan}
        />
      )}
    </div>
  );
}