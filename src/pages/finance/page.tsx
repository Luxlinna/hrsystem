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
import { useFinance } from "./hooks/useFinance";
import { INITIAL_EXPENSE_FORM } from "./constants";

export default function FinancePage() {
  const {
    canManage,
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
    editingExpense,
    setEditingExpense,
    saving,
    expenseForm,
    setExpenseForm,
    updateStatus,
    handleCreateExpense,
    openEditModal,
    handleSaveEdit,
    handleDeleteExpense,
    handleExportCSV,
  } = useFinance();

  const handleOpenNewExpense = useCallback(() => {
    setExpenseForm({
      ...INITIAL_EXPENSE_FORM,
      branch_id: branches[0]?.id || "",
      submitted_by: actorName,
    });
    setModal(true);
  }, [branches, actorName, setExpenseForm, setModal]);

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

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <FinanceHeader
        canManage={canManage}
        onExportCSV={handleExportCSV}
        onOpenNewExpense={handleOpenNewExpense}
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
    </div>
  );
}