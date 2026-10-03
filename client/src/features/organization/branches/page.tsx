import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { BranchTabsNav, BranchTabType } from "./components/BranchTabsNav";
import { BranchTabContent } from "./components/BranchTabContent";
import { BranchModal } from "./components/BranchModal";
import { useBranches } from "./hooks/useBranches";

const TAB_STORAGE_KEY = "hr_branch_active_tab";

export default function Branches() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    canManage, isAdmin, isSuperAdmin, branches, loading, selectedBranch,
    setSelectedBranch, activeBu, allowedBranches, setSelectedBranchId,
    empLoading, showAddModal, modalInitialTab, editingBranchId, searchTerm,
    setSearchTerm, filterStatus, setFilterStatus, submitting, locating,
    geocoding, addressLookup, setAddressLookup, addressInputRef, form,
    setForm, filteredBranches, totalEmployees, activeBranches, deptGroups,
    openAddModal, openEditModal, closeModal, handleAddBranch,
    useCurrentLocation, handleGeocodeAddress, handleDeleteBranch, canCreateBranch,
  } = useBranches();

  const initialTab = useMemo<BranchTabType>(() => {
    const urlTab = searchParams.get("tab") as BranchTabType | null;
    if (urlTab) return urlTab;
    const storedTab = localStorage.getItem(TAB_STORAGE_KEY) as BranchTabType | null;
    return storedTab || "profile";
  }, []);

  const [activeTab, setActiveTabState] = useState<BranchTabType>(initialTab);

  const handleTabChange = useCallback((tab: BranchTabType) => {
    setActiveTabState(tab);
    localStorage.setItem(TAB_STORAGE_KEY, tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", tab);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    const urlTab = searchParams.get("tab") as BranchTabType | null;
    if (urlTab && urlTab !== activeTab) {
      setActiveTabState(urlTab);
      localStorage.setItem(TAB_STORAGE_KEY, urlTab);
    }
  }, [searchParams]);

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
      <div className="flex-1 min-w-0">
        <div className="p-3 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <span>WORKSPACE</span><span className="text-slate-300">/</span><span className="text-slate-600">BUSINESS UNIT (BU)</span>
              </div>
              <div className="flex items-center gap-2.5 mt-1 sm:mt-1.5 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {activeTab === "all" ? "Business Unit Management" : currentBranch?.name || "Company Profile"}
                </h1>
                {activeTab !== "all" && currentBranch && (
                  <span className={`inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 rounded-full border ${currentBranch.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${currentBranch.status === "active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {currentBranch.status === "active" ? "Active" : "Inactive"}
                  </span>
                )}
              </div>
            </div>
            {canCreateBranch && (
              <button type="button" onClick={openAddModal} className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#0088cc] hover:bg-[#0077b3] text-white text-[12.5px] sm:text-[13px] font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer w-full sm:w-auto">
                <i className="ri-add-line text-base" />New Business Unit
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <BranchTabsNav activeTab={activeTab} setActiveTab={handleTabChange} isSuperAdmin={isSuperAdmin} totalBranches={branches.length} employeeCount={currentBranch?.employee_count || 0} />

          {/* Tab Body Content */}
          <BranchTabContent
            activeTab={activeTab}
            currentBranch={currentBranch}
            canManage={canManage}
            isAdmin={isAdmin}
            isSuperAdmin={isSuperAdmin}
            branches={branches}
            filteredBranches={filteredBranches}
            activeBranches={activeBranches}
            totalEmployees={totalEmployees}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            deptGroups={deptGroups}
            empLoading={empLoading}
            allowedBranches={allowedBranches}
            onSelectBranch={(b) => { setSelectedBranch(b); setSelectedBranchId(b.id); }}
            onSelectBranchId={(id) => { const b = branches.find((x) => x.id === id); if (b) { setSelectedBranch(b); setSelectedBranchId(b.id); } }}
            onDeleteBranch={handleDeleteBranch}
            onOpenEditModal={openEditModal}
            setActiveTab={handleTabChange}
          />
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
