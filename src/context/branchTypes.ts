export interface BranchInfo {
  id: string;
  name: string;
  location?: string | null;
  status?: string | null;
  branch_id?: string | null;
  is_site?: boolean;
  work_start_time?: string | null;
  work_end_time?: string | null;
  break_start_time?: string | null;
  break_end_time?: string | null;
  late_grace_minutes?: number | null;
  early_leave_grace_minutes?: number | null;
  morning_check_in_start?: string | null;
  morning_check_in_end?: string | null;
  morning_check_out_start?: string | null;
  morning_check_out_end?: string | null;
  afternoon_check_in_start?: string | null;
  afternoon_check_in_end?: string | null;
  afternoon_check_out_start?: string | null;
  afternoon_check_out_end?: string | null;
  is_four_punch_enabled?: boolean;
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
