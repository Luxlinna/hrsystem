import { BranchesHeader } from "./components/BranchesHeader";
import { BranchStatsRow } from "./components/BranchStatsRow";
import { BranchFilters } from "./components/BranchFilters";
import { BranchGrid } from "./components/BranchGrid";
import { BranchDetailDrawer } from "./components/BranchDetailDrawer";
import { BranchModal } from "./components/BranchModal";
import { useBranches } from "./hooks/useBranches";

export default function Branches() {
  const {
    canManage,
    isAdmin,
    isSuperAdmin,
    userBranchId,
    branches,
    loading,
    selectedBranch,
    branchEmployees,
    empLoading,
    showAddModal,
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
    openDetail,
    closeDetail,
    openAddModal,
    openEditModal,
    closeModal,
    handleAddBranch,
    useCurrentLocation,
    handleGeocodeAddress,
    toggleBranchStatus,
    handleDeleteBranch,
  } = useBranches();

  if (loading && branches.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Main Content */}
      <div className={`flex-1 min-w-0 transition-all duration-300 ${selectedBranch ? "sm:mr-[420px]" : ""}`}>
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <BranchesHeader
            canManage={canManage}
            activeBranches={activeBranches}
            totalEmployees={totalEmployees}
            onOpenAddModal={openAddModal}
          />

          {/* Stats Row */}
          <BranchStatsRow
            totalBranches={branches.length}
            activeBranches={activeBranches}
            totalEmployees={totalEmployees}
          />

          {/* Filters */}
          <BranchFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />

          {/* Branch Grid */}
          <BranchGrid
            branches={filteredBranches}
            selectedBranchId={selectedBranch?.id ?? null}
            isAdmin={isAdmin}
            onSelectBranch={openDetail}
            onDeleteBranch={handleDeleteBranch}
          />
        </div>
      </div>

      {/* Detail Panel */}
      <BranchDetailDrawer
        branch={selectedBranch}
        employees={branchEmployees}
        deptGroups={deptGroups}
        empLoading={empLoading}
        canManage={canManage}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        userBranchId={userBranchId}
        onClose={closeDetail}
        onOpenEditModal={openEditModal}
        onDeleteBranch={handleDeleteBranch}
        onToggleStatus={toggleBranchStatus}
      />

      {/* Add / Edit Branch Modal */}
      <BranchModal
        isOpen={showAddModal}
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
