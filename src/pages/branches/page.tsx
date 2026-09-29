import { useState, useMemo } from "react";
import { BranchCompanyProfileSection } from "./components/BranchCompanyProfileSection";
import { BranchWorkSitesSection } from "./components/BranchWorkSitesSection";
import { BranchDepartmentsSection } from "./components/BranchDepartmentsSection";
import { BranchPositionsSection } from "./components/BranchPositionsSection";
import { BranchEmployeeTypesSection } from "./components/BranchEmployeeTypesSection";
import { BranchBiometricsSection } from "./components/BranchBiometricsSection";
import { BranchStaffSection } from "./components/BranchStaffSection";
import { BranchStatsRow } from "./components/BranchStatsRow";
import { BranchFilters } from "./components/BranchFilters";
import { BranchGrid } from "./components/BranchGrid";
import { BranchModal } from "./components/BranchModal";
import { useBranches } from "./hooks/useBranches";

export default function Branches() {
  const {
    canManage,
    isAdmin,
    isSuperAdmin,
    branches,
    loading,
    selectedBranch,
    setSelectedBranch,
    activeBu,
    allowedBranches,
    setSelectedBranchId,
    empLoading,
    showAddModal,
    modalInitialTab,
    editingBranchId,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus,
    submitting,
    locating,
    geocoding,
    addressLookup,
    setAddressLookup,
    addressInputRef,
    form,
    setForm,
    filteredBranches,
    totalEmployees,
    activeBranches,
    deptGroups,
    openAddModal,
    openEditModal,
    closeModal,
    handleAddBranch,
    useCurrentLocation,
    handleGeocodeAddress,
    handleDeleteBranch,
  } = useBranches();

  // Active tab: defaults to "profile" (Company Profile)
  const [activeTab, setActiveTab] = useState<"profile" | "sites" | "departments" | "positions" | "employee-types" | "schedule" | "staff" | "all">("profile");

  // The active BU for this user: strictly scoped to their own BU or selected BU
  const currentBranch = useMemo(() => {
    if (selectedBranch) return selectedBranch;
    return activeBu || branches[0] || null;
  }, [selectedBranch, activeBu, branches]);

  if (loading && branches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-8 h-8 border-2 border-[#0088cc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* 1. Sleek Enterprise Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <span>WORKSPACE</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600">BUSINESS UNIT (BU)</span>
              </div>
              <div className="flex items-center gap-2.5 mt-1 sm:mt-1.5 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {activeTab === "all" ? "Business Unit Management" : currentBranch?.name || "Company Profile"}
                </h1>

                {activeTab !== "all" && currentBranch && (
                  <span
                    className={`inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full border ${
                      currentBranch.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        currentBranch.status === "active" ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {currentBranch.status === "active" ? "Active" : "Inactive"}
                  </span>
                )}
              </div>
            </div>

            {/* Super Admin Top Actions */}
            {isSuperAdmin && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openAddModal}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#0088cc] hover:bg-[#0077b3] text-white text-[12.5px] sm:text-[13px] font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer w-full sm:w-auto"
                >
                  <i className="ri-add-line text-base" />
                  New Business Unit
                </button>
              </div>
            )}
          </div>

          {/* 2. Flat Modern Enterprise Navigation Tabs */}
          <div className="flex items-center gap-4 sm:gap-6 border-b border-slate-200 -mb-2 overflow-x-auto text-[12.5px] sm:text-[13.5px] no-scrollbar">
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`pb-2.5 sm:pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "all"
                    ? "border-[#0088cc] text-[#0088cc]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <i className="ri-layout-grid-line text-sm sm:text-base" />
                All Units ({branches.length})
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`pb-2.5 sm:pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "profile"
                  ? "border-[#0088cc] text-[#0088cc]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <i className="ri-building-line text-sm sm:text-base" />
              Company Profile
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sites")}
              className={`pb-2.5 sm:pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "sites"
                  ? "border-[#0088cc] text-[#0088cc]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <i className="ri-map-pin-2-line text-sm sm:text-base" />
              Sites & Workstations
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("departments")}
              className={`pb-2.5 sm:pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "departments"
                  ? "border-[#0088cc] text-[#0088cc]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <i className="ri-node-tree text-sm sm:text-base" />
              Departments
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("positions")}
              className={`pb-2.5 sm:pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "positions"
                  ? "border-[#0088cc] text-[#0088cc]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <i className="ri-briefcase-line text-sm sm:text-base" />
              Positions
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("employee-types")}
              className={`pb-2.5 sm:pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "employee-types"
                  ? "border-[#0088cc] text-[#0088cc]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <i className="ri-user-settings-line text-sm sm:text-base" />
              Employee Types
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("schedule")}
              className={`pb-2.5 sm:pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "schedule"
                  ? "border-[#0088cc] text-[#0088cc]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <i className="ri-time-line text-sm sm:text-base" />
              Grace & Shift Policy
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("staff")}
              className={`pb-2.5 sm:pb-3 font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === "staff"
                  ? "border-[#0088cc] text-[#0088cc]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <i className="ri-team-line text-sm sm:text-base" />
              Staff Directory ({currentBranch?.employee_count || 0})
            </button>
          </div>

          {/* TAB 0: ALL BUSINESS UNITS (Super Admin Overview) */}
          {activeTab === "all" && isSuperAdmin && (
            <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
              <BranchStatsRow
                totalBranches={branches.length}
                activeBranches={activeBranches}
                totalEmployees={totalEmployees}
              />
              <BranchFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
              />
              <BranchGrid
                branches={filteredBranches}
                selectedBranchId={currentBranch?.id ?? null}
                isAdmin={isAdmin || isSuperAdmin}
                onSelectBranch={(b) => {
                  setSelectedBranch(b);
                  setSelectedBranchId(b.id);
                  setActiveTab("profile");
                }}
                onDeleteBranch={handleDeleteBranch}
              />
            </div>
          )}

          {/* TAB 1: COMPANY PROFILE (Exact Reference Screenshot Layout) */}
          {activeTab === "profile" && currentBranch && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <BranchCompanyProfileSection
                branch={currentBranch}
                canManage={canManage}
                onOpenEditModal={openEditModal}
                allowedBranches={allowedBranches}
                onSelectBranchId={(id) => {
                  const b = branches.find((x) => x.id === id);
                  if (b) {
                    setSelectedBranch(b);
                    setSelectedBranchId(b.id);
                  }
                }}
                hideHeader={false}
              />
            </div>
          )}

          {/* TAB 2: SITES & WORKSTATIONS */}
          {activeTab === "sites" && currentBranch && (
            <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <BranchWorkSitesSection
                  branchId={currentBranch.id}
                  branchName={currentBranch.company_name || currentBranch.name}
                  canManage={canManage}
                />
              </div>
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <BranchBiometricsSection branchId={currentBranch.id} branchName={currentBranch.name} canManage={canManage} />
              </div>
            </div>
          )}

          {/* TAB 3: DEPARTMENTS */}
          {activeTab === "departments" && currentBranch && (
            <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
              <BranchDepartmentsSection
                branchId={currentBranch.id}
                canManage={canManage}
              />
            </div>
          )}

          {/* TAB 4: POSITIONS */}
          {activeTab === "positions" && currentBranch && (
            <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
              <BranchPositionsSection
                branchId={currentBranch.id}
                canManage={canManage}
              />
            </div>
          )}

          {/* TAB 5: EMPLOYEE TYPES */}
          {activeTab === "employee-types" && currentBranch && (
            <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
              <BranchEmployeeTypesSection
                branchId={currentBranch.id}
                canManage={canManage}
              />
            </div>
          )}

          {/* TAB 3: WORK SCHEDULE & GRACE POLICY */}
          {activeTab === "schedule" && currentBranch && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-7 space-y-5 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 sm:pb-4 gap-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Work Schedule & Attendance Policy</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Operating hours and grace windows applied for {currentBranch.name}</p>
                </div>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => openEditModal(currentBranch, "schedule")}
                    className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-[#0088cc] border border-[#0088cc]/30 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    <i className="ri-edit-line" />
                    Adjust Hours
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Check-In Time</span>
                  <p className="text-lg sm:text-xl font-bold text-slate-900">
                    {currentBranch.work_start_time ? currentBranch.work_start_time.slice(0, 5) : "08:00"}
                  </p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    +{currentBranch.late_grace_minutes ?? 15} mins late grace chance
                  </p>
                </div>
                <div className="p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-100">
                  <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Check-Out Time</span>
                  <p className="text-lg sm:text-xl font-bold text-slate-900">
                    {currentBranch.work_end_time ? currentBranch.work_end_time.slice(0, 5) : "17:00"}
                  </p>
                  <p className="text-xs text-indigo-600 font-semibold mt-1">
                    {currentBranch.early_leave_grace_minutes ?? 15} mins early departure grace
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STAFF DIRECTORY */}
          {activeTab === "staff" && currentBranch && (
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <BranchStaffSection
                deptGroups={deptGroups}
                empLoading={empLoading}
                branchName={currentBranch.name}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Branch & Company Profile Modal */}
      <BranchModal
        isOpen={showAddModal}
        initialTab={modalInitialTab}
        editingBranchId={editingBranchId}
        form={form}
        setForm={setForm}
        addressLookup={addressLookup}
        setAddressLookup={setAddressLookup}
        addressInputRef={addressInputRef}
        locating={locating}
        geocoding={geocoding}
        submitting={submitting}
        onClose={closeModal}
        onSubmit={handleAddBranch}
        onUseCurrentLocation={useCurrentLocation}
        onGeocodeAddress={handleGeocodeAddress}
      />
    </div>
  );
}
