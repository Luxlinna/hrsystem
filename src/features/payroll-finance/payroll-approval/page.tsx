import { PayrollApprovalHeader } from "./components/PayrollApprovalHeader";
import { PayrollApprovalPendingBanner } from "./components/PayrollApprovalPendingBanner";
import { PayrollApprovalStatsRow } from "./components/PayrollApprovalStatsRow";
import { PayrollApprovalFilterBar } from "./components/PayrollApprovalFilterBar";
import { PayrollRunsListView } from "./components/tabs/PayrollRunsListView";
import { ItemizedRecordsTableView } from "./components/tabs/ItemizedRecordsTableView";
import { CreatePayrollRunView } from "./components/tabs/CreatePayrollRunView";
import { PayrollApprovalModalsContainer } from "./components/modals/PayrollApprovalModalsContainer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { usePayrollApproval } from "./hooks/usePayrollApproval";

export default function PayrollApproval() {
  const p = usePayrollApproval();

  const activeBranch = p.branches.find((b) => b.id === (p.targetBranch || p.userBranchId));
  const activeBranchName = activeBranch?.name;

  if (p.loading && p.runs.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading payroll approval center...</p>
      </div>
    );
  }

  if (p.isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <PayrollApprovalHeader
          canManage={false}
          onOpenCreate={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Payroll Approval Center"
          userBranchName={activeBranchName}
          hasNoBranch={!p.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      <PayrollApprovalHeader
        canManage={p.canManage}
        branchName={activeBranchName}
        onOpenCreate={() => p.setTab("create")}
        tab={p.tab}
        runs={p.displayedRuns}
        itemizedRecords={p.filteredItemized}
      />

      {p.canManage && (
        <PayrollApprovalPendingBanner
          pendingCount={p.pendingRuns.length}
          onReviewNow={() => p.setTab("pending")}
        />
      )}

      <PayrollApprovalStatsRow
        tab={p.tab}
        onSelectTab={p.setTab}
        pendingCount={p.pendingRuns.length}
        totalPendingNet={p.totalPendingNet}
        approvedCount={p.approvedRuns.length}
        totalApprovedNet={p.totalApprovedNet}
        processedCount={p.processedRuns.length}
        totalProcessedNet={p.totalProcessedNet}
        itemizedCount={p.itemizedRecords.length}
      />

      <PayrollApprovalFilterBar
        tab={p.tab}
        setTab={p.setTab}
        pendingCount={p.pendingRuns.length}
        approvedCount={p.approvedRuns.length}
        historyCount={p.historyRuns.length}
        itemizedCount={p.itemizedRecords.length}
        canManage={p.canManage}
        searchQuery={p.searchQuery}
        setSearchQuery={p.setSearchQuery}
        periodFilter={p.periodFilter}
        setPeriodFilter={p.setPeriodFilter}
        deptFilter={p.deptFilter}
        setDeptFilter={p.setDeptFilter}
        periods={p.periods}
      />

      {p.tab === "pending" && (
        <PayrollRunsListView
          runs={p.displayedRuns}
          getRunApprovals={p.getRunApprovals}
          canManage={p.canManage}
          processingId={p.processingId}
          onApprove={(run) => p.setActionModal({ run, action: "approve" })}
          onReject={(run) => p.setActionModal({ run, action: "reject" })}
          onProcess={p.handleProcess}
          onViewBatch={p.setViewingBatchRecords}
          emptyTitle="No Pending Payroll Runs"
          emptyDescription="All submitted department payroll batches have been signed off or processed."
        />
      )}

      {p.tab === "approved" && (
        <PayrollRunsListView
          runs={p.displayedRuns}
          getRunApprovals={p.getRunApprovals}
          canManage={p.canManage}
          processingId={p.processingId}
          onApprove={(run) => p.setActionModal({ run, action: "approve" })}
          onReject={(run) => p.setActionModal({ run, action: "reject" })}
          onProcess={p.handleProcess}
          onViewBatch={p.setViewingBatchRecords}
          emptyTitle="No Batches Awaiting Disbursement"
          emptyDescription="Approved batches ready for payment will appear here."
        />
      )}

      {p.tab === "history" && (
        <PayrollRunsListView
          runs={p.displayedRuns}
          getRunApprovals={p.getRunApprovals}
          canManage={p.canManage}
          processingId={p.processingId}
          onApprove={(run) => p.setActionModal({ run, action: "approve" })}
          onReject={(run) => p.setActionModal({ run, action: "reject" })}
          onProcess={p.handleProcess}
          onViewBatch={p.setViewingBatchRecords}
          emptyTitle="No Historical Records"
          emptyDescription="Past payroll runs and completed batches will be logged here."
        />
      )}

      {p.tab === "itemized" && (
        <ItemizedRecordsTableView records={p.filteredItemized} />
      )}

      {p.tab === "create" && p.canManage && (
        <CreatePayrollRunView
          form={p.createForm}
          setForm={p.setCreateForm}
          creating={p.creating}
          branchDepartments={p.branchDepartments}
          onSubmit={p.handleCreate}
          onCancel={() => p.setTab("pending")}
        />
      )}

      <PayrollApprovalModalsContainer
        {...p}
      />
    </div>
  );
}