import { useReportsData } from "./hooks/useReportsData";
import { FilterSidebar } from "./components/FilterSidebar";
import { ReportPreviewHeader } from "./components/ReportPreviewHeader";

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

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Reports &amp; Export Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live DB
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">Generate, preview, and export HR reports per module</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left panel — Module Selector + Filters */}
        <FilterSidebar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          recordStatus={recordStatus}
          setRecordStatus={setRecordStatus}
          employeeSearch={employeeSearch}
          setEmployeeSearch={setEmployeeSearch}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          branchFilter={branchFilter}
          setBranchFilter={setBranchFilter}
          departments={departments}
          branches={branches}
          isEmployeeScoped={isEmployeeScoped}
          isNameScoped={isNameScoped}
          isDateScoped={isDateScoped}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
        />

        {/* Right panel — Report Preview */}
        <div className="flex-1 min-w-0">
          <ReportPreviewHeader
            activeModule={activeModule}
            config={reportConfig}
            onDataReady={handleDataReady}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            isDateScoped={isDateScoped}
            reportColumns={reportColumns}
            reportData={reportData}
          />
        </div>
      </div>
    </div>
  );
}
