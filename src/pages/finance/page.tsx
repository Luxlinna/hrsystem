import { useCallback } from "react";
import { FinanceHeader } from "./components/FinanceHeader";
import { FinanceMetricCards } from "./components/FinanceMetricCards";
import { CategoryBreakdownChart } from "./components/CategoryBreakdownChart";
import { MonthlyTimelineChart } from "./components/MonthlyTimelineChart";
import { FinanceFilterBar } from "./components/FinanceFilterBar";
import { FinanceCardsView } from "./components/FinanceCardsView";
import { FinanceTableView } from "./components/FinanceTableView";
import { Pagination } from "./components/Pagination";
import { ExpenseDetailDrawer } from "./components/ExpenseDetailDrawer";
import { ExpenseModal } from "./components/ExpenseModal";
import { BranchFinancePolicyModal } from "./components/modals/BranchFinancePolicyModal";
import { useFinance } from "./hooks/useFinance";
import { INITIAL_EXPENSE_FORM } from "./constants";

export default function FinancePage() {
  const {
    canManage,
    isSuperAdmin,
    isPartnerBranchBlocked,
    userBranchId,
    targetBranch,
    branchPolicy,
    actorName,
    expenses,
    branches,
    loading,
    selectedExpense,
    setSelectedExpense,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    branchFilter,
    setBranchFilter,
    datePreset,
    setDatePreset,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    viewMode,
    setViewMode,
    pageSize,
    setPageSize,
    page,
    setPage,
    filtered,
    totalPages,
    pageStart,
    pageEnd,
    pagedExpenses,
    totalAmount,
    paidAmount,
    approvedAmount,
    pendingAmount,
    categoryChartData,
    monthlyTimelineData,
    modal,
    setModal,
    policyModalOpen,
    setPolicyModalOpen,
    editingExpense,
    setEditingExpense,
    saving,
    savingPolicy,
    expenseForm,
    setExpenseForm,
    updateStatus,
    handleCreateExpense,
    openEditModal,
    handleSaveEdit,
    handleDeleteExpense,
    handleSavePolicy,
    handleExportCSV,
  } = useFinance();

  const activeBranch = branches.find((b) => b.id === (targetBranch || userBranchId));
  const activeBranchName = activeBranch?.name;

  const handleOpenNewExpense = useCallback(() => {
    setExpenseForm({
      ...INITIAL_EXPENSE_FORM,
      branch_id: targetBranch || branches[0]?.id || "",
      submitted_by: actorName,
    });
    setModal(true);
  }, [branches, targetBranch, actorName, setExpenseForm, setModal]);

  const handleResetPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading financial operations...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
        <FinanceHeader
          canManage={false}
          onExportCSV={() => {}}
          onOpenNewExpense={() => {}}
        />
        <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-800 rounded-3xl border border-rose-200/80 dark:border-rose-900/40 shadow-sm text-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 text-3xl">
            <i className="ri-shield-keyhole-line" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
            Partner Branch Finance Privacy Shield
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed mb-4">
            Operational expenses, branch budgets, invoices, and financial reimbursement policies are strictly confidential to each partner branch. Super Admins and users cannot view or audit financial records of other partner branches.
          </p>
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 rounded-2xl text-rose-800 dark:text-rose-300 text-xs font-semibold text-left flex items-start gap-2.5">
            <i className="ri-lock-line text-base shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Access Restricted to Home Branch</p>
              <p className="text-[11px] opacity-90 mt-0.5">
                {userBranchId
                  ? `You are assigned to ${activeBranchName || "your home branch"}. Please switch back to your home branch in the header switcher to view your financial ledgers.`
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
      <FinanceHeader
        canManage={canManage}
        branchName={activeBranchName}
        onExportCSV={handleExportCSV}
        onOpenNewExpense={handleOpenNewExpense}
        onOpenPolicyModal={targetBranch ? () => setPolicyModalOpen(true) : undefined}
      />

      {/* Executive Financial KPI Cards */}
      <FinanceMetricCards
        totalAmount={totalAmount}
        paidAmount={paidAmount}
        approvedAmount={approvedAmount}
        pendingAmount={pendingAmount}
        filteredCount={filtered.length}
        statusFilter={statusFilter}
        onFilterStatus={setStatusFilter}
      />

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <CategoryBreakdownChart
          categoryChartData={categoryChartData}
          totalAmount={totalAmount}
        />
        <MonthlyTimelineChart monthlyTimelineData={monthlyTimelineData} />
      </div>

      {/* Control Bar */}
      <FinanceFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        branchFilter={branchFilter}
        setBranchFilter={setBranchFilter}
        datePreset={datePreset}
        setDatePreset={setDatePreset}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        branches={branches}
        onResetPage={handleResetPage}
      />

      {/* Expenses Data Display */}
      {viewMode === "table" ? (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <FinanceTableView
            expenses={pagedExpenses}
            canManage={canManage}
            onSelect={setSelectedExpense}
            onUpdateStatus={updateStatus}
            onEdit={openEditModal}
            onDelete={handleDeleteExpense}
          />
          <Pagination
            totalCount={filtered.length}
            pageSize={pageSize}
            setPageSize={setPageSize}
            page={page}
            setPage={setPage}
            totalPages={totalPages}
            pageStart={pageStart}
            pageEnd={pageEnd}
          />
        </div>
      ) : (
        <FinanceCardsView
          expenses={pagedExpenses}
          canManage={canManage}
          onSelect={setSelectedExpense}
          onUpdateStatus={updateStatus}
          onEdit={openEditModal}
          onDelete={handleDeleteExpense}
          onOpenNewExpense={handleOpenNewExpense}
        />
      )}

      {/* Drawer: Expense Detail View */}
      <ExpenseDetailDrawer
        selectedExpense={selectedExpense}
        canManage={canManage}
        onClose={() => setSelectedExpense(null)}
        onUpdateStatus={updateStatus}
        onOpenEditModal={openEditModal}
        onDeleteExpense={handleDeleteExpense}
      />

      {/* Modal: Create Expense */}
      <ExpenseModal
        isOpen={modal}
        editingExpense={null}
        form={expenseForm}
        setForm={setExpenseForm}
        branches={branches}
        saving={saving}
        onClose={() => setModal(false)}
        onSubmit={handleCreateExpense}
      />

      {/* Modal: Edit Expense */}
      <ExpenseModal
        isOpen={Boolean(editingExpense)}
        editingExpense={editingExpense}
        form={expenseForm}
        setForm={setExpenseForm}
        branches={branches}
        saving={saving}
        onClose={() => setEditingExpense(null)}
        onSubmit={handleSaveEdit}
      />

      {/* Modal: Branch Finance Policy */}
      <BranchFinancePolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        policy={branchPolicy}
        branchName={activeBranchName}
        isSuperAdmin={isSuperAdmin}
        canManage={canManage}
        saving={savingPolicy}
        onSave={handleSavePolicy}
      />
    </div>
  );
}