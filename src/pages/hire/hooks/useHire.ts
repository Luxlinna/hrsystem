import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { useHireData } from "./useHireData";
import { useHireFilters } from "./useHireFilters";
import { useHiringRequests } from "./useHiringRequests";
import { useHireModals } from "./useHireModals";
import { useHireActions } from "./useHireActions";
import { useHireCandidateActions } from "./useHireCandidateActions";
import { useRecruitmentActions } from "./useRecruitmentActions";
import { useRecruitmentSlaWatcher } from "./useRecruitmentSlaWatcher";

export function useHire() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const {
    isSuperAdmin, isBranchAdmin, effectiveBranchId, effectiveBranchName,
    userBranchId, userBranchName, isPartnerBranchBlocked, selectedBranchId, targetBranch, isHrDivision,
  } = useBranchScope();
  const { employee: myEmployee } = useMyEmployee();

  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const actorRole = role?.name || "Admin";
  const canRequest = true;

  const hasEnterpriseRecruitmentPermission = Boolean(
    isSuperAdmin ||
    role?.hiring_requests_hr_admin_approve ||
    role?.hiring_requests_hr_review ||
    role?.hiring_requests_chairman_approve ||
    isHrDivision
  );

  const isHrDivisionBranch = Boolean(
    /hr\s*division/i.test(effectiveBranchName || "") ||
    /hr\s*division/i.test(userBranchName || "")
  );

  const isAllBranches = !effectiveBranchId || effectiveBranchId === "all";
  const canViewCrossBranch = Boolean(
    hasEnterpriseRecruitmentPermission && (isAllBranches || !effectiveBranchId || effectiveBranchId === userBranchId || isHrDivisionBranch)
  );

  const canBranchApprove = Boolean(isSuperAdmin || role?.hiring_requests_branch_approve || isBranchAdmin);
  const canHrReview = Boolean(isSuperAdmin || role?.hiring_requests_hr_review);
  const canHrAdminApprove = Boolean(isSuperAdmin || role?.hiring_requests_hr_admin_approve);
  const canChairmanApprove = Boolean(isSuperAdmin || role?.hiring_requests_chairman_approve);

  const canApprove = canBranchApprove || canHrReview || canHrAdminApprove || canChairmanApprove;
  const isChairman = canChairmanApprove;

  const data = useHireData();
  const filters = useHireFilters(data.jobs, data.candidates, data.interviews, data.branches);
  const requests = useHiringRequests({
    actorName, actorRole, actorEmail: user?.email, myEmployeeId: myEmployee?.id,
    userBranchId, userBranchName, isAdmin, isSuperAdmin, isBranchAdmin,
    canChairmanApprove, loadData: data.loadData, branches: data.branches,
  });

  const modals = useHireModals({
    branches: data.branches, jobs: data.jobs, candidates: data.candidates,
    selectedBranchId, effectiveBranchId, userBranchId, targetBranch,
  });

  const actions = useHireActions({
    actorName, actorRole, loadData: data.loadData, branches: data.branches, jobs: data.jobs,
  });

  const candidateActions = useHireCandidateActions({
    actorName, actorRole, myEmployeeId: myEmployee?.id, loadData: data.loadData, branches: data.branches, jobs: data.jobs,
    setUploadingResume: actions.setUploadingResume, setSchedulingInterview: actions.setSchedulingInterview,
    setMovingToOnboarding: actions.setMovingToOnboarding, setSavingFeedback: actions.setSavingFeedback,
  });

  const recruitmentActions = useRecruitmentActions({
    candidates: data.candidates, interviews: data.interviews, hiringRequests: data.hiringRequests,
    actorRole, myEmployeeRole: myEmployee?.role, myEmployeeId: myEmployee?.id, myDepartment: myEmployee?.department,
    isHrDivisionScope: canViewCrossBranch || isHrDivisionBranch || isHrDivision,
  });

  const { getRequisitionSla } = useRecruitmentSlaWatcher({
    hiringRequests: data.hiringRequests, candidates: data.candidates,
  });

  const handleSaveJob = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (await actions.handleSaveJob(modals.newJob, modals.editingJob)) modals.setJobModal(false);
  }, [actions, modals]);

  const handleSaveCandidate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (await candidateActions.handleSaveCandidate(modals.newCandidate, modals.editingCandidate, modals.candidateFiles)) modals.setCandidateModal(false);
  }, [candidateActions, modals]);

  const handleMergeCandidate = useCallback(async (existingCandidateId: string) => {
    if (await candidateActions.handleMergeCandidate(existingCandidateId, modals.newCandidate, modals.candidateFiles)) {
      modals.setCandidateModal(false);
      return true;
    }
    return false;
  }, [candidateActions, modals]);

  const handleSaveInterview = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (await candidateActions.handleSaveInterview(modals.newInterview, modals.editingInterview)) modals.setInterviewModal(false);
  }, [candidateActions, modals]);

  const handleMoveToOnboarding = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modals.onboardingCandidate) return;
    if (await candidateActions.handleMoveToOnboarding(modals.onboardingCandidate, modals.onboardingBranchId, modals.onboardingJoinDate)) modals.setOnboardingModal(false);
  }, [candidateActions, modals]);

  const handleSaveFeedback = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modals.feedbackInterview) return;
    if (await candidateActions.handleSaveFeedback(modals.feedbackInterview, modals.feedbackScore, modals.feedbackNotes)) modals.setFeedbackModal(false);
  }, [candidateActions, modals]);

  return {
    isPartnerBranchBlocked, userBranchName, userBranchId, actorName, actorEmail: user?.email, myEmployeeId: myEmployee?.id,
    jobs: data.jobs, candidates: data.candidates, allCandidates: data.allCandidates, interviews: data.interviews, branches: data.branches, employees: data.employees,
    hiringRequests: data.hiringRequests, loading: data.loading, loadData: data.loadData, tab: filters.tab, setTab: filters.setTab,
    canRequest, canApprove, canBranchApprove, canHrReview, canHrAdminApprove, canChairmanApprove, isHrDivisionBranch, canViewCrossBranch,
    isHrDivisionScope: canViewCrossBranch || isHrDivisionBranch || isHrDivision, recruitmentActions, isChairman, isSuperAdmin, isAdmin, isBranchAdmin,
    jobViewMode: filters.jobViewMode, setJobViewMode: filters.setJobViewMode, candidateViewMode: filters.candidateViewMode, setCandidateViewMode: filters.setCandidateViewMode,
    searchQuery: filters.searchQuery, setSearchQuery: filters.setSearchQuery, filterJobStatus: filters.filterJobStatus, setFilterJobStatus: filters.setFilterJobStatus,
    filterDepartment: filters.filterDepartment, setFilterDepartment: filters.setFilterDepartment, filterBranch: filters.filterBranch, setFilterBranch: filters.setFilterBranch,
    filterCandidateStage: filters.filterCandidateStage, setFilterCandidateStage: filters.setFilterCandidateStage, filterCandidateJob: filters.filterCandidateJob, setFilterCandidateJob: filters.setFilterCandidateJob,
    filterInterviewStatus: filters.filterInterviewStatus, setFilterInterviewStatus: filters.setFilterInterviewStatus, resetFilters: filters.resetFilters, hasFilters: filters.hasFilters,
    departments: filters.departments, filteredJobs: filters.filteredJobs, filteredCandidates: filters.filteredCandidates, filteredInterviews: filters.filteredInterviews,
    pipelineStageCounts: filters.pipelineStageCounts, jobModal: modals.jobModal, setJobModal: modals.setJobModal, editingJob: modals.editingJob, newJob: modals.newJob, setNewJob: modals.setNewJob,
    candidateModal: modals.candidateModal, setCandidateModal: modals.setCandidateModal, editingCandidate: modals.editingCandidate, newCandidate: modals.newCandidate, setNewCandidate: modals.setNewCandidate,
    candidateFiles: modals.candidateFiles, setCandidateFiles: modals.setCandidateFiles, resumeFile: modals.resumeFile, setResumeFile: modals.setResumeFile,
    uploadingResume: actions.uploadingResume, interviewModal: modals.interviewModal, setInterviewModal: modals.setInterviewModal, editingInterview: modals.editingInterview, newInterview: modals.newInterview, setNewInterview: modals.setNewInterview,
    schedulingInterview: actions.schedulingInterview, onboardingModal: modals.onboardingModal, setOnboardingModal: modals.setOnboardingModal, onboardingCandidate: modals.onboardingCandidate, onboardingBranchId: modals.onboardingBranchId, setOnboardingBranchId: modals.setOnboardingBranchId,
    onboardingJoinDate: modals.onboardingJoinDate, setOnboardingJoinDate: modals.setOnboardingJoinDate, movingToOnboarding: actions.movingToOnboarding,
    feedbackModal: modals.feedbackModal, setFeedbackModal: modals.setFeedbackModal, feedbackInterview: modals.feedbackInterview, feedbackScore: modals.feedbackScore, setFeedbackScore: modals.setFeedbackScore, feedbackNotes: modals.feedbackNotes,
    setFeedbackNotes: modals.setFeedbackNotes, savingFeedback: actions.savingFeedback, postingJob: actions.postingJob,
    showRequestModal: requests.showRequestModal, setShowRequestModal: requests.setShowRequestModal, requestForm: requests.requestForm, setRequestForm: requests.setRequestForm, submittingRequest: requests.submittingRequest, decisionModal: requests.decisionModal,
    setDecisionModal: requests.setDecisionModal, targetRequest: requests.targetRequest, decisionAction: requests.decisionAction, rejectionReason: requests.rejectionReason, setRejectionReason: requests.setRejectionReason, processingDecision: requests.processingDecision,
    openCreateRequest: requests.openCreateRequest, openDecisionModal: requests.openDecisionModal, handleCreateRequest: requests.handleCreateRequest, handleDeleteRequest: requests.handleDeleteRequest, handleDecision: requests.handleDecision, handleAssignHrOfficer: requests.handleAssignHrOfficer,
    openCreateJob: modals.openCreateJob, openEditJob: modals.openEditJob, openCreateCandidate: modals.openCreateCandidate, openEditCandidate: modals.openEditCandidate, openCreateInterview: modals.openCreateInterview,
    openEditInterview: modals.openEditInterview, openMoveToOnboarding: modals.openMoveToOnboarding, openFeedbackModal: modals.openFeedbackModal,
    handleSaveJob, handleSaveCandidate, handleMergeCandidate, handleSaveInterview, closeJob: actions.closeJob, reopenJob: actions.reopenJob, deleteJob: actions.deleteJob,
    updateCandidateStage: actions.updateCandidateStage, rateCandidate: actions.rateCandidate, deleteCandidate: actions.deleteCandidate,
    handleMoveToOnboarding, uploadCandidateResume: candidateActions.uploadCandidateResume, deleteInterview: actions.deleteInterview, handleSaveFeedback, getRequisitionSla,
  };
}
