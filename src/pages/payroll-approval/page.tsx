import { PayrollApprovalHeader } from "./components/PayrollApprovalHeader";
import { PayrollApprovalPendingBanner } from "./components/PayrollApprovalPendingBanner";
import { PayrollApprovalStatsRow } from "./components/PayrollApprovalStatsRow";
import { PayrollApprovalFilterBar } from "./components/PayrollApprovalFilterBar";
import { PayrollRunsListView } from "./components/tabs/PayrollRunsListView";
import { ItemizedRecordsTableView } from "./components/tabs/ItemizedRecordsTableView";
import { CreatePayrollRunView } from "./components/tabs/CreatePayrollRunView";
import { ActionApprovalModal } from "./components/modals/ActionApprovalModal";
import { BatchItemizedDrilldownModal } from "./components/modals/BatchItemizedDrilldownModal";
import { usePayrollApproval } from "./hooks/usePayrollApproval";

export default function PayrollApproval() {
  const {
    canManage,
    isSuperAdmin,
    isPartnerBranchBlocked,
    userBranchId,
    targetBranch,
    branches,
    branchDepartments,
    runs,
    loading,
    getRunApprovals,
    pendingRuns,
    approvedRuns,
    processedRuns,
    historyRuns,
    periods,
    totalPendingNet,
    totalApprovedNet,
    totalProcessedNet,
    tab,
    setTab,
    searchQuery,
    setSearchQuery,
    periodFilter,
    setPeriodFilter,
    deptFilter,
    setDeptFilter,
    displayedRuns,
    filteredItemized,
    actionModal,
    setActionModal,
    actionNote,
    setActionNote,
    acting,
    processingId,
    viewingBatchRecords,
    setViewingBatchRecords,
    createForm,
    setCreateForm,
    creating,
    handleAction,
    handleProcess,
    handleCreate,
    itemizedRecords,
  } = usePayrollApproval();

  const activeBranch = branches.find((b) => b.id === (targetBranch || userBranchId));
  const activeBranchName = activeBranch?.name;

  if (loading && runs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading payroll approval center...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <PayrollApprovalHeader
          canManage={false}
          onOpenCreate={() => {}}
        />
        <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-800 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 shadow-sm text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 text-3xl">
            <i className="ri-shield-keyhole-line" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Partner Branch Approval Privacy Shield
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
            Department batches, executive sign-off workflows, and financial disbursement pipelines are strictly private to each partner branch. Super Admins and users cannot inspect or authorize other partner branches' payroll runs.
          </p>
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl text-rose-800 dark:text-rose-300 text-xs font-semibold text-left flex items-start gap-2.5">
            <i className="ri-lock-line text-base shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Access Restricted to Home Branch</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {userBranchId
                  ? `You are assigned to ${activeBranchName || "your home branch"}. Please switch back to your home branch in the header switcher to view your approval queue.`
                  : "You are not assigned to any branch. Please contact your company administrator to assign you to a branch."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <PayrollApprovalHeader
        canManage={canManage}
        branchName={activeBranchName}
        onOpenCreate={() => setTab("create")}
      />

      {/* Pending Approval Alert Banner */}
      {canManage && (
        <PayrollApprovalPendingBanner
          pendingCount={pendingRuns.length}
          onReviewNow={() => setTab("pending")}
        />
      )}

      {/* Executive KPI Performance Bar */}
      <PayrollApprovalStatsRow
        tab={tab}
        onSelectTab={setTab}
        pendingCount={pendingRuns.length}
        totalPendingNet={totalPendingNet}
        approvedCount={approvedRuns.length}
        totalApprovedNet={totalApprovedNet}
        processedCount={processedRuns.length}
        totalProcessedNet={totalProcessedNet}
        itemizedCount={itemizedRecords.length}
      />

      {/* Control Bar: Tabs, Search & Filters */}
      <PayrollApprovalFilterBar
        tab={tab}
        setTab={setTab}
        pendingCount={pendingRuns.length}
        approvedCount={approvedRuns.length}
        historyCount={historyRuns.length}
        itemizedCount={itemizedRecords.length}
        canManage={canManage}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        periodFilter={periodFilter}
        setPeriodFilter={setPeriodFilter}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        periods={periods}
      />

      {/* Tab 1: Pending Authorization Queue */}
      {tab === "pending" && (
        <PayrollRunsListView
          runs={displayedRuns}
          getRunApprovals={getRunApprovals}
          canManage={canManage}
          processingId={processingId}
          onApprove={(run) => setActionModal({ run, action: "approve" })}
          onReject={(run) => setActionModal({ run, action: "reject" })}
          onProcess={handleProcess}
          onViewBatch={setViewingBatchRecords}
          emptyTitle="No Pending Payroll Runs"
          emptyDescription="All submitted department payroll batches have been signed off or processed."
        />
      )}

      {/* Tab 2: Ready for Disbursement */}
      {tab === "approved" && (
        <PayrollRunsListView
          runs={displayedRuns}
          getRunApprovals={getRunApprovals}
          canManage={canManage}
          processingId={processingId}
          onApprove={(run) => setActionModal({ run, action: "approve" })}
          onReject={(run) => setActionModal({ run, action: "reject" })}
          onProcess={handleProcess}
          onViewBatch={setViewingBatchRecords}
          emptyTitle="No Batches Awaiting Disbursement"
          emptyDescription="Approved batches ready for payment will appear here."
        />
      )}

      {/* Tab 3: Historical Runs & Processed Batches */}
      {tab === "history" && (
        <PayrollRunsListView
          runs={displayedRuns}
          getRunApprovals={getRunApprovals}
          canManage={canManage}
          processingId={processingId}
          onApprove={(run) => setActionModal({ run, action: "approve" })}
          onReject={(run) => setActionModal({ run, action: "reject" })}
          onProcess={handleProcess}
          onViewBatch={setViewingBatchRecords}
          emptyTitle="No Historical Records"
          emptyDescription="Past payroll runs and completed batches will be logged here."
        />
      )}

      {/* Tab 4: Itemized Employee Payslips */}
      {tab === "itemized" && (
        <ItemizedRecordsTableView records={filteredItemized} />
      )}

      {/* Tab 5: Create New Payroll Run */}
      {tab === "create" && canManage && (
        <CreatePayrollRunView
          form={createForm}
          setForm={setCreateForm}
          creating={creating}
          branchDepartments={branchDepartments}
          onSubmit={handleCreate}
          onCancel={() => setTab("pending")}
        />
      )}

      {/* Modals */}
      <ActionApprovalModal
        isOpen={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        actionModal={actionModal}
        actionNote={actionNote}
        setActionNote={setActionNote}
        acting={acting}
        onConfirm={handleAction}
      />

      <BatchItemizedDrilldownModal
        isOpen={Boolean(viewingBatchRecords)}
        onClose={() => setViewingBatchRecords(null)}
        run={viewingBatchRecords}
        itemizedRecords={itemizedRecords}
      />
    </div>
  );
}