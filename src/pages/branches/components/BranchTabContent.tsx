import type { Branch, Employee } from "../types";
import { BranchTabType } from "./tabs/types";
import { BranchStatsRow } from "./BranchStatsRow";
import { BranchFilters } from "./BranchFilters";
import { BranchGrid } from "./BranchGrid";
import { BranchCompanyProfileSection } from "./BranchCompanyProfileSection";
import { BranchWorkSitesSection } from "./BranchWorkSitesSection";
import { BranchBiometricsSection } from "./BranchBiometricsSection";
import { BranchDivisionsSection } from "./BranchDivisionsSection";
import { BranchDepartmentsSection } from "./BranchDepartmentsSection";
import { BranchPositionsSection } from "./BranchPositionsSection";
import { BranchEmployeeTypesSection } from "./BranchEmployeeTypesSection";
import { BranchEmployeeLevelsSection } from "./BranchEmployeeLevelsSection";
import { BranchContractTypesSection } from "./BranchContractTypesSection";
import { BranchJobStatusesSection } from "./BranchJobStatusesSection";
import { BranchSchedulePolicySection } from "./BranchSchedulePolicySection";

interface BranchTabContentProps {
  activeTab: BranchTabType;
  currentBranch: Branch | null;
  canManage: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  branches: Branch[];
  filteredBranches: Branch[];
  activeBranches: number;
  totalEmployees: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  deptGroups: Record<string, Employee[]>;
  empLoading: boolean;
  allowedBranches: Branch[];
  onSelectBranch: (branch: Branch) => void;
  onSelectBranchId: (id: string) => void;
  onDeleteBranch: (branch: Branch) => Promise<boolean | void> | void;
  onOpenEditModal: (branch: Branch, tab?: "profile" | "schedule") => void;
  setActiveTab: (tab: BranchTabType) => void;
}

export function BranchTabContent({
  activeTab,
  currentBranch,
  canManage,
  isAdmin,
  isSuperAdmin,
  branches,
  filteredBranches,
  activeBranches,
  totalEmployees,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  deptGroups,
  empLoading,
  allowedBranches,
  onSelectBranch,
  onSelectBranchId,
  onDeleteBranch,
  onOpenEditModal,
  setActiveTab,
}: BranchTabContentProps) {
  if (activeTab === "all" && isSuperAdmin) {
    return (
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
            onSelectBranch(b);
            setActiveTab("profile");
          }}
          onDeleteBranch={onDeleteBranch}
        />
      </div>
    );
  }

  if (!currentBranch) return null;

  return (
    <>
      {activeTab === "profile" && (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <BranchCompanyProfileSection
            branch={currentBranch}
            canManage={canManage}
            onOpenEditModal={(b) => onOpenEditModal(b, "profile")}
            allowedBranches={allowedBranches}
            onSelectBranchId={onSelectBranchId}
            hideHeader={false}
          />
        </div>
      )}

      {activeTab === "sites" && (
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

      {activeTab === "divisions" && (
        <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
          <BranchDivisionsSection branchId={currentBranch.id} canManage={canManage} />
        </div>
      )}

      {activeTab === "departments" && (
        <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
          <BranchDepartmentsSection branchId={currentBranch.id} canManage={canManage} />
        </div>
      )}

      {activeTab === "positions" && (
        <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
          <BranchPositionsSection branchId={currentBranch.id} canManage={canManage} />
        </div>
      )}

      {activeTab === "employee-types" && (
        <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
          <BranchEmployeeTypesSection branchId={currentBranch.id} canManage={canManage} />
        </div>
      )}

      {activeTab === "employee-levels" && (
        <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
          <BranchEmployeeLevelsSection branchId={currentBranch.id} canManage={canManage} />
        </div>
      )}

      {activeTab === "contract-types" && (
        <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
          <BranchContractTypesSection branchId={currentBranch.id} canManage={canManage} />
        </div>
      )}

      {activeTab === "job-statuses" && (
        <div className="space-y-4 sm:space-y-6 pt-1 sm:pt-2">
          <BranchJobStatusesSection branchId={currentBranch.id} canManage={canManage} />
        </div>
      )}

      {activeTab === "schedule" && (
        <BranchSchedulePolicySection
          branch={currentBranch}
          canManage={canManage}
          onOpenEditModal={onOpenEditModal}
        />
      )}
    </>
  );
}
