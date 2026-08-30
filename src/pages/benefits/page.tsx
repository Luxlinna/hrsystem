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
    isPartnerBranchBlocked, userBranchName, userBranchId, canManage,
    tab, setTab, data, metrics, filters, mutations,
    selectedPlan, setSelectedPlan, enrollModal, setEnrollModal,
    planModal, setPlanModal, editingPlan, setEditingPlan,
    enrollForm, setEnrollForm, enrollEmployeeIds, setEnrollEmployeeIds,
    planForm, setPlanForm, openNewPlanModal, openEditPlan, openEnrollWithPlan,
    handleBatchEnrollSubmit, handleCreatePlanSubmit, handleSavePlanEditSubmit,
  } = useBenefits();

  if (data.loading && data.plans.length === 0) {
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
      <BenefitsHeader
        canManage={canManage}
        onExportCSV={filters.handleExportCSV}
        onOpenNewPlanModal={openNewPlanModal}
        onOpenEnrollModal={() => setEnrollModal(true)}
      />

      <MetricCards
        activePlans={metrics.activePlans}
        providersCount={metrics.providersList.length}
        totalEnrolled={metrics.totalEnrolled}
        overallRate={metrics.overallRate}
        optedOut={metrics.optedOut}
        totalEligible={metrics.totalEligible}
        tab={tab}
        enrollStatusFilter={filters.enrollStatusFilter}
        onSelectPlans={() => { setTab("plans"); filters.setPlanStatusFilter("all"); }}
        onSelectEnrolled={() => { setTab("enrollment"); filters.setEnrollStatusFilter("enrolled"); }}
        onSelectOptedOut={() => { setTab("enrollment"); filters.setEnrollStatusFilter("opted_out"); }}
      />

      <NavigationTabs
        tab={tab}
        setTab={setTab}
        plansCount={data.plans.length}
        enrollmentsCount={data.enrollments.length}
        providersCount={metrics.providersList.length}
        viewMode={filters.viewMode}
        setViewMode={filters.setViewMode}
      />

      {tab === "plans" && (
        <PlansTab
          plans={data.plans}
          filteredPlans={filters.filteredPlans}
          enrollments={data.enrollments}
          canManage={canManage}
          viewMode={filters.viewMode}
          planSearchQuery={filters.planSearchQuery}
          setPlanSearchQuery={filters.setPlanSearchQuery}
          planTypeFilter={filters.planTypeFilter}
          setPlanTypeFilter={filters.setPlanTypeFilter}
          planStatusFilter={filters.planStatusFilter}
          setPlanStatusFilter={filters.setPlanStatusFilter}
          onSelectPlan={setSelectedPlan}
          onOpenEditPlan={openEditPlan}
          onDeletePlan={mutations.handleDeletePlan}
          onOpenEnrollModal={openEnrollWithPlan}
          onOpenNewPlanModal={openNewPlanModal}
        />
      )}

      {tab === "enrollment" && (
        <EnrollmentTab
          enrollments={data.enrollments}
          filteredEnrollments={filters.filteredEnrollments}
          plans={data.plans}
          departments={metrics.departments}
          canManage={canManage}
          enrollSearchQuery={filters.enrollSearchQuery}
          setEnrollSearchQuery={filters.setEnrollSearchQuery}
          enrollPlanFilter={filters.enrollPlanFilter}
          setEnrollPlanFilter={filters.setEnrollPlanFilter}
          enrollStatusFilter={filters.enrollStatusFilter}
          setEnrollStatusFilter={filters.setEnrollStatusFilter}
          enrollDeptFilter={filters.enrollDeptFilter}
          setEnrollDeptFilter={filters.setEnrollDeptFilter}
          onToggleEnrollmentStatus={mutations.toggleEnrollmentStatus}
          onOpenEnrollModal={() => setEnrollModal(true)}
        />
      )}

      {tab === "providers" && (
        <ProvidersTab
          providersList={metrics.providersList}
          onSelectPlan={setSelectedPlan}
        />
      )}

      <PlanDrawer
        selectedPlan={selectedPlan}
        enrollments={data.enrollments}
        canManage={canManage}
        onClose={() => setSelectedPlan(null)}
        onOpenEditPlan={openEditPlan}
        onDeletePlan={mutations.handleDeletePlan}
        onOpenEnrollModal={openEnrollWithPlan}
        onToggleEnrollmentStatus={mutations.toggleEnrollmentStatus}
      />

      <BatchEnrollModal
        isOpen={enrollModal}
        onClose={() => setEnrollModal(false)}
        plans={data.plans}
        employees={data.employees}
        enrollForm={enrollForm}
        setEnrollForm={setEnrollForm}
        enrollEmployeeIds={enrollEmployeeIds}
        setEnrollEmployeeIds={setEnrollEmployeeIds}
        saving={mutations.saving}
        onSubmit={handleBatchEnrollSubmit}
      />

      <PlanFormModal
        isOpen={planModal || !!editingPlan}
        onClose={() => { setPlanModal(false); setEditingPlan(null); }}
        editingPlan={editingPlan}
        planForm={planForm}
        setPlanForm={setPlanForm}
        saving={mutations.saving}
        onSubmit={editingPlan ? handleSavePlanEditSubmit : handleCreatePlanSubmit}
      />
    </div>
  );
}