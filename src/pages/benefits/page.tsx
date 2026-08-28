import { BenefitsHeader } from "./components/BenefitsHeader";
import { MetricCards } from "./components/MetricCards";
import { NavigationTabs } from "./components/NavigationTabs";
import { PlanDrawer } from "./components/PlanDrawer";
import { BatchEnrollModal } from "./components/BatchEnrollModal";
import { PlanFormModal } from "./components/PlanFormModal";
import { PlansTab } from "./tabs/PlansTab";
import { EnrollmentTab } from "./tabs/EnrollmentTab";
import { ProvidersTab } from "./tabs/ProvidersTab";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useBenefits } from "./hooks/useBenefits";

export default function Benefits() {
  const {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    canManage,
    tab,
    setTab,
    plans,
    enrollments,
    employees,
    loading,
    planSearchQuery,
    setPlanSearchQuery,
    planTypeFilter,
    setPlanTypeFilter,
    planStatusFilter,
    setPlanStatusFilter,
    viewMode,
    setViewMode,
    enrollSearchQuery,
    setEnrollSearchQuery,
    enrollPlanFilter,
    setEnrollPlanFilter,
    enrollStatusFilter,
    setEnrollStatusFilter,
    enrollDeptFilter,
    setEnrollDeptFilter,
    selectedPlan,
    setSelectedPlan,
    enrollModal,
    setEnrollModal,
    planModal,
    setPlanModal,
    editingPlan,
    setEditingPlan,
    saving,
    enrollForm,
    setEnrollForm,
    enrollEmployeeIds,
    setEnrollEmployeeIds,
    planForm,
    setPlanForm,
    activePlans,
    totalEnrolled,
    optedOut,
    totalEligible,
    overallRate,
    departments,
    filteredPlans,
    filteredEnrollments,
    providersList,
    toggleEnrollmentStatus,
    handleBatchEnroll,
    handleCreatePlan,
    openEditPlan,
    handleSavePlanEdit,
    handleDeletePlan,
    handleExportCSV,
    openNewPlanModal,
    openEnrollWithPlan,
  } = useBenefits();

  if (loading && plans.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading benefits administration...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <BenefitsHeader
          canManage={false}
          onExportCSV={() => {}}
          onOpenNewPlanModal={() => {}}
          onOpenEnrollModal={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Benefits & Compensation"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <BenefitsHeader
        canManage={canManage}
        onExportCSV={handleExportCSV}
        onOpenNewPlanModal={openNewPlanModal}
        onOpenEnrollModal={() => setEnrollModal(true)}
      />

      {/* Executive KPI Metric Cards */}
      <MetricCards
        activePlans={activePlans}
        providersCount={providersList.length}
        totalEnrolled={totalEnrolled}
        overallRate={overallRate}
        optedOut={optedOut}
        totalEligible={totalEligible}
        tab={tab}
        enrollStatusFilter={enrollStatusFilter}
        onSelectPlans={() => {
          setTab("plans");
          setPlanStatusFilter("all");
        }}
        onSelectEnrolled={() => {
          setTab("enrollment");
          setEnrollStatusFilter("enrolled");
        }}
        onSelectOptedOut={() => {
          setTab("enrollment");
          setEnrollStatusFilter("opted_out");
        }}
      />

      {/* Tabs & View Switcher Navigation */}
      <NavigationTabs
        tab={tab}
        setTab={setTab}
        plansCount={plans.length}
        enrollmentsCount={enrollments.length}
        providersCount={providersList.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Tab 1: Benefit Plans Catalog */}
      {tab === "plans" && (
        <PlansTab
          plans={plans}
          filteredPlans={filteredPlans}
          enrollments={enrollments}
          canManage={canManage}
          viewMode={viewMode}
          planSearchQuery={planSearchQuery}
          setPlanSearchQuery={setPlanSearchQuery}
          planTypeFilter={planTypeFilter}
          setPlanTypeFilter={setPlanTypeFilter}
          planStatusFilter={planStatusFilter}
          setPlanStatusFilter={setPlanStatusFilter}
          onSelectPlan={setSelectedPlan}
          onOpenEditPlan={openEditPlan}
          onDeletePlan={handleDeletePlan}
          onOpenEnrollModal={openEnrollWithPlan}
          onOpenNewPlanModal={openNewPlanModal}
        />
      )}

      {/* Tab 2: Employee Enrollment Roster */}
      {tab === "enrollment" && (
        <EnrollmentTab
          enrollments={enrollments}
          filteredEnrollments={filteredEnrollments}
          plans={plans}
          departments={departments}
          canManage={canManage}
          enrollSearchQuery={enrollSearchQuery}
          setEnrollSearchQuery={setEnrollSearchQuery}
          enrollPlanFilter={enrollPlanFilter}
          setEnrollPlanFilter={setEnrollPlanFilter}
          enrollStatusFilter={enrollStatusFilter}
          setEnrollStatusFilter={setEnrollStatusFilter}
          enrollDeptFilter={enrollDeptFilter}
          setEnrollDeptFilter={setEnrollDeptFilter}
          onToggleEnrollmentStatus={toggleEnrollmentStatus}
          onOpenEnrollModal={() => setEnrollModal(true)}
        />
      )}

      {/* Tab 3: Insurance Providers Directory */}
      {tab === "providers" && (
        <ProvidersTab
          providersList={providersList}
          onSelectPlan={setSelectedPlan}
        />
      )}

      {/* Slide-over Plan Reader Drawer */}
      <PlanDrawer
        selectedPlan={selectedPlan}
        enrollments={enrollments}
        canManage={canManage}
        onClose={() => setSelectedPlan(null)}
        onOpenEditPlan={openEditPlan}
        onDeletePlan={handleDeletePlan}
        onOpenEnrollModal={openEnrollWithPlan}
        onToggleEnrollmentStatus={toggleEnrollmentStatus}
      />

      {/* Batch Multi-Select Enrollment Modal */}
      <BatchEnrollModal
        isOpen={enrollModal}
        onClose={() => setEnrollModal(false)}
        plans={plans}
        employees={employees}
        enrollForm={enrollForm}
        setEnrollForm={setEnrollForm}
        enrollEmployeeIds={enrollEmployeeIds}
        setEnrollEmployeeIds={setEnrollEmployeeIds}
        saving={saving}
        onSubmit={handleBatchEnroll}
      />

      {/* Create / Edit Benefit Plan Modal */}
      <PlanFormModal
        isOpen={planModal || !!editingPlan}
        onClose={() => {
          setPlanModal(false);
          setEditingPlan(null);
        }}
        editingPlan={editingPlan}
        planForm={planForm}
        setPlanForm={setPlanForm}
        saving={saving}
        onSubmit={editingPlan ? handleSavePlanEdit : handleCreatePlan}
      />
    </div>
  );
}