import { useCallback } from "react";
import { OrgChartHeader } from "./components/OrgChartHeader";
import { OrgChartFilterBar } from "./components/OrgChartFilterBar";
import { OrgChartView } from "./components/tree/OrgChartView";
import { OrgChartDepartmentsView } from "./components/departments/OrgChartDepartmentsView";
import { OrgChartListView } from "./components/list/OrgChartListView";
import { EmployeeQuickDrawer } from "./components/modals/EmployeeQuickDrawer";
import { EditManagerModal } from "./components/modals/EditManagerModal";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useOrgChart } from "./hooks/useOrgChart";

export default function OrgChart() {
  const {
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    canEditManager,
    employees,
    branches,
    loading,
    tree,
    toggleNode,
    expandAll,
    collapseAll,
    searchTerm,
    setSearchTerm,
    deptFilter,
    setDeptFilter,
    viewMode,
    setViewMode,
    departments,
    filteredList,
    selectedEmployee,
    setSelectedEmployee,
    editManagerModal,
    setEditManagerModal,
    newManagerId,
    setNewManagerId,
    saving,
    handleUpdateManager,
    openEditManager,
  } = useOrgChart();

  const getDirectReports = useCallback(
    (id: string) => employees.filter((e) => e.reports_to === id),
    [employees]
  );

  const getManager = useCallback(
    (managerId: string | null) => employees.find((e) => e.id === managerId),
    [employees]
  );

  const activeBranchName = branches.length === 1 ? branches[0]?.name : (employees[0]?.branches?.name || undefined);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="p-6 lg:p-10 min-h-screen bg-[#F8F9FB] dark:bg-slate-900 font-sans">
        <OrgChartHeader
          employeeCount={0}
          deptCount={0}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onExpandAll={() => {}}
          onCollapseAll={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Organization Chart"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#F8F9FB] dark:bg-slate-900 font-sans">
      {/* Header */}
      <OrgChartHeader
        employeeCount={employees.length}
        deptCount={departments.length}
        branchName={activeBranchName}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        employees={employees}
      />

      {/* Search, Filter & Legend Bar */}
      <OrgChartFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        departments={departments}
        viewMode={viewMode}
      />

      {/* View 1: Tree View */}
      {viewMode === "tree" && (
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-2xs">
          <OrgChartView
            tree={tree}
            searchTerm={searchTerm}
            deptFilter={deptFilter}
            onToggleNode={toggleNode}
            onSelectEmployee={setSelectedEmployee}
          />
        </div>
      )}

      {/* View 2: Departments / Teams Grid View */}
      {viewMode === "departments" && (
        <OrgChartDepartmentsView
          employees={filteredList}
          searchTerm={searchTerm}
          onSelectEmployee={setSelectedEmployee}
        />
      )}

      {/* View 3: Table List View */}
      {viewMode === "list" && (
        <OrgChartListView
          employees={filteredList}
          canEditManager={canEditManager}
          onOpenEditManager={openEditManager}
          getManager={getManager}
          getDirectReports={getDirectReports}
        />
      )}

      {/* Modals & Quick Drawers */}
      <EmployeeQuickDrawer
        selectedEmployee={selectedEmployee}
        canEditManager={canEditManager}
        onClose={() => setSelectedEmployee(null)}
        onOpenEditManager={openEditManager}
        getManager={getManager}
        getDirectReports={getDirectReports}
      />

      <EditManagerModal
        isOpen={editManagerModal}
        onClose={() => setEditManagerModal(false)}
        selectedEmployee={selectedEmployee}
        employees={employees}
        newManagerId={newManagerId}
        setNewManagerId={setNewManagerId}
        saving={saving}
        onSave={handleUpdateManager}
      />
    </div>
  );
}