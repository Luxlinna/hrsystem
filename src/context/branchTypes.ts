export interface BranchInfo {
  id: string;
  name: string;
  location?: string | null;
  status?: string | null;
  branch_id?: string | null;
  is_site?: boolean;
}

export interface BranchContextType {
  branches: BranchInfo[];
  visibleBranches: BranchInfo[];
  loading: boolean;
  userBranchId: string | null;
  userBranchName: string | null;
  userSiteId?: string | null;
  userSiteName?: string | null;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  effectiveBranchId: string | null;
  effectiveBranchName: string | null;
  selectedSiteId: string | null;
  targetBranch: string | null;
  isPartnerBranchBlocked: boolean;
  isSuperAdmin: boolean;
  isBranchAdmin: boolean;
  isBranchScoped: boolean;
  refreshBranches: () => Promise<void>;
}
