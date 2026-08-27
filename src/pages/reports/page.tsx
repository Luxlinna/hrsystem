import { useState } from "react";
import { ReportsHeader } from "./components/ReportsHeader";
import { ReportsSidebarFilters } from "./components/filters/ReportsSidebarFilters";
import ReportViewer from "./components/ReportViewer";
import { useReportsData } from "./hooks/useReportsData";
import { exportToCSV, exportToExcel, exportToPDF } from "./exportUtils";

export default function ReportsPage() {
  const {
    activeModule,
    setActiveModule,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    recordStatus,
    setRecordStatus,
    employeeSearch,
    setEmployeeSearch,
    departmentFilter,
    setDepartmentFilter,
    branchFilter,
    setBranchFilter,
    departments,
    branches,
    reportData,
    reportColumns,
    isEmployeeScoped,
    isNameScoped,
    isDateScoped,
    reportConfig,
    handleDataReady,
  } = useReportsData();

  const [exporting, setExporting] = useState<"pdf" | "csv" | "xlsx" | null>(null);

  const handleExportCSV = () => {
    setExporting("csv");
    exportToCSV(activeModule, reportColumns, reportData);
    setTimeout(() => setExporting(null), 800);
  };

  const handleExportExcel = () => {
    setExporting("xlsx");
    exportToExcel(activeModule, reportColumns, reportData);
    setTimeout(() => setExporting(null), 800);
  };

  const handleExportPDF = () => {
    setExporting("pdf");
    exportToPDF(activeModule, reportColumns, reportData, dateFrom, dateTo, isDateScoped);
    setTimeout(() => setExporting(null), 800);
  };

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-6 font-sans">
      {/* Top Header with Export Action Menu */}
      <ReportsHeader
        reportDataLength={reportData.length}
        exporting={exporting}
        onExportPDF={handleExportPDF}
        onExportCSV={handleExportCSV}
        onExportExcel={handleExportExcel}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel — Module Selector + Filters */}
        <ReportsSidebarFilters
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          recordStatus={recordStatus}
          setRecordStatus={setRecordStatus}
          isEmployeeScoped={isEmployeeScoped}
          isNameScoped={isNameScoped}
          employeeSearch={employeeSearch}
          setEmployeeSearch={setEmployeeSearch}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          branchFilter={branchFilter}
          setBranchFilter={setBranchFilter}
          departments={departments}
          branches={branches}
          isDateScoped={isDateScoped}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
        />

        {/* Right panel — Live Database Report Table View */}
        <ReportViewer
          config={reportConfig}
          onDataReady={handleDataReady}
        />
      </div>
    </div>
  );
}
