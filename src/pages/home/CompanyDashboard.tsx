import { DashboardHero } from "./components/DashboardHero";
import { DashboardKpiGrid } from "./components/DashboardKpiGrid";
import { AttentionAlertRow } from "./components/AttentionAlertRow";
import { OnboardingPipelineSection } from "./components/OnboardingPipelineSection";
import { LeaveAndPayrollSection } from "./components/LeaveAndPayrollSection";
import { HiringOverviewSection } from "./components/HiringOverviewSection";
import { AnnouncementsSection } from "./components/AnnouncementsSection";
import { HrAnalyticsKpiSection } from "./components/HrAnalyticsKpiSection";
import { AnalyticsChartsSection } from "./components/AnalyticsChartsSection";
import { AdminActionsSection } from "./components/AdminActionsSection";
import { MobileFabQuickActions } from "./components/MobileFabQuickActions";
import { useCompanyDashboard } from "./hooks/useCompanyDashboard";

export default function CompanyDashboard() {
  const {
    user,
    can,
    stats,
    onboarding,
    leaveRequests,
    payroll,
    jobs,
    candidates,
    announcements,
    loading,
    refreshing,
    deptData,
    lastUpdated,
    isPulling,
    pullDistance,
    PULL_THRESHOLD,
    hrKpis,
    attendanceData,
    hiringTrend,
    fabOpen,
    setFabOpen,
    fabRef,
    handleRefresh,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useCompanyDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentMonthLabel = new Date().toLocaleDateString("en-US", { month: "long" });
  const displayName =
    (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";

  const showLeave = can("leave");
  const showPayroll = can("payroll");
  const showHrInsights = can("attendance") || can("training") || can("disciplinary");
  const showAnalyticsCharts = can("analytics");

  return (
    <div
      className="min-h-screen bg-[#F8FAFC]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh mobile indicator */}
      {isPulling && pullDistance > 10 && (
        <div
          className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-[#253C7D] text-white transition-all"
          style={{ height: `${Math.min(pullDistance, PULL_THRESHOLD)}px` }}
        >
          <i
            className={`ri-refresh-line text-lg ${
              pullDistance >= PULL_THRESHOLD ? "animate-spin" : ""
            }`}
          />
          <span className="text-xs ml-2">
            {pullDistance >= PULL_THRESHOLD ? "Release to refresh" : "Pull to refresh"}
          </span>
        </div>
      )}

      {/* Hero Header */}
      <DashboardHero
        displayName={displayName}
        stats={stats}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        {/* KPI Grid */}
        <DashboardKpiGrid
          stats={stats}
          can={can}
          currentMonthLabel={currentMonthLabel}
        />

        {/* Needs Your Attention Alert Row */}
        <AttentionAlertRow stats={stats} can={can} />

        {/* Onboarding Pipeline */}
        <OnboardingPipelineSection
          onboarding={onboarding}
          canOnboarding={can("onboarding")}
        />

        {/* Leave Requests & Payroll Split Section */}
        <LeaveAndPayrollSection
          showLeave={showLeave}
          showPayroll={showPayroll}
          leaveRequests={leaveRequests}
          payroll={payroll}
          statsPayrollTotal={stats.payrollTotal}
          statsPayrollProcessed={stats.payrollProcessed}
          currentMonthLabel={currentMonthLabel}
        />

        {/* Hiring Overview */}
        <HiringOverviewSection
          jobs={jobs}
          candidates={candidates}
          canHire={can("hire")}
        />

        {/* Announcements Section */}
        <AnnouncementsSection
          announcements={announcements}
          canAnnouncements={can("announcements")}
        />

        {/* HR Analytics KPI Widgets */}
        <HrAnalyticsKpiSection
          hrKpis={hrKpis}
          showHrInsights={showHrInsights}
          can={can}
        />

        {/* Analytics Charts Section */}
        <AnalyticsChartsSection
          showAnalyticsCharts={showAnalyticsCharts}
          attendanceData={attendanceData}
          deptData={deptData}
          hiringTrend={hiringTrend}
        />

        {/* Administrative Quick Actions */}
        <AdminActionsSection can={can} />
      </div>

      {/* Mobile Floating Action Button */}
      <MobileFabQuickActions
        fabOpen={fabOpen}
        setFabOpen={setFabOpen}
        fabRef={fabRef}
        can={can}
      />
    </div>
  );
}
