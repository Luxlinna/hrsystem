import { useCallback } from "react";
import { OrgChartHeader } from "./components/OrgChartHeader";
import { OrgChartFilterBar } from "./components/OrgChartFilterBar";
import { OrgChartView } from "./components/tree/OrgChartView";
import { OrgChartListView } from "./components/list/OrgChartListView";
import { EmployeeQuickDrawer } from "./components/modals/EmployeeQuickDrawer";
import { EditManagerModal } from "./components/modals/EditManagerModal";
import { useOrgChart } from "./hooks/useOrgChart";

export default function OrgChart() {
  const {
    canEditManager,
    employees,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white font-sans">
      {/* Header */}
      <OrgChartHeader
        employeeCount={employees.length}
        deptCount={departments.length}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
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
        <OrgChartView
          tree={tree}
          searchTerm={searchTerm}
          deptFilter={deptFilter}
          onToggleNode={toggleNode}
          onSelectEmployee={setSelectedEmployee}
        />
      )}

      {/* View 2: Table List View */}
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