import { memo } from "react";
import { JobModal } from "./JobModal";
import { CandidateModal } from "./CandidateModal";
import { InterviewModal } from "./InterviewModal";
import { MoveToOnboardingModal } from "./MoveToOnboardingModal";
import { FeedbackModal } from "./FeedbackModal";
import { CreateHiringRequestModal } from "./CreateHiringRequestModal";
import { DecisionHiringRequestModal } from "./DecisionHiringRequestModal";
import type { Branch, Job, Candidate, Interview, HiringRequest, NewJobFormState, NewCandidateFormState, NewInterviewFormState, NewHiringRequestFormState } from "../../types";

interface HireModalsContainerProps {
  jobModal: boolean;
  setJobModal: (val: boolean) => void;
  editingJob: Job | null;
  newJob: NewJobFormState;
  setNewJob: React.Dispatch<React.SetStateAction<NewJobFormState>>;
  branches: Branch[];
  postingJob: boolean;
  handleSaveJob: (e: React.FormEvent) => void;

  candidateModal: boolean;
  setCandidateModal: (val: boolean) => void;
  editingCandidate: Candidate | null;
  newCandidate: NewCandidateFormState;
  setNewCandidate: React.Dispatch<React.SetStateAction<NewCandidateFormState>>;
  candidateFiles?: File[];
  setCandidateFiles?: React.Dispatch<React.SetStateAction<File[]>>;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  uploadingResume: boolean;
  jobs: Job[];
  candidates: Candidate[];
  allCandidates?: Candidate[];
  handleSaveCandidate: (e: React.FormEvent) => void;
  handleMergeCandidate?: (existingCandidateId: string) => Promise<boolean>;

  interviewModal: boolean;
  setInterviewModal: (val: boolean) => void;
  editingInterview: Interview | null;
  newInterview: NewInterviewFormState;
  setNewInterview: React.Dispatch<React.SetStateAction<NewInterviewFormState>>;
  schedulingInterview: boolean;
  handleSaveInterview: (e: React.FormEvent) => void;

  onboardingModal: boolean;
  setOnboardingModal: (val: boolean) => void;
  onboardingCandidate: Candidate | null;
  onboardingBranchId: string;
  setOnboardingBranchId: (val: string) => void;
  onboardingJoinDate: string;
  setOnboardingJoinDate: (val: string) => void;
  movingToOnboarding: boolean;
  handleMoveToOnboarding: (e: React.FormEvent) => void;

  feedbackModal: boolean;
  setFeedbackModal: (val: boolean) => void;
  feedbackInterview: Interview | null;
  feedbackScore: number;
  setFeedbackScore: (val: number) => void;
  feedbackNotes: string;
  setFeedbackNotes: (val: string) => void;
  savingFeedback: boolean;
  handleSaveFeedback: (e: React.FormEvent) => void;

  showRequestModal: boolean;
  setShowRequestModal: (val: boolean) => void;
  requestForm: NewHiringRequestFormState;
  setRequestForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
  submittingRequest: boolean;
  departments: string[];
  isSuperAdmin: boolean;
  isBranchAdmin?: boolean;
  userBranchId?: string | null;
  userBranchName?: string | null;
  targetBranch?: string | null;
  isHrDivisionBranch?: boolean;
  employees?: any[];
  handleCreateRequest: (e: React.FormEvent) => void;

  decisionModal: boolean;
  setDecisionModal: (val: boolean) => void;
  targetRequest: HiringRequest | null;
  decisionAction: "approved" | "rejected";
  rejectionReason: string;
  setRejectionReason: (val: string) => void;
  processingDecision: boolean;
  handleDecision: (e: React.FormEvent) => void;
}

export const HireModalsContainer = memo(function HireModalsContainer(props: HireModalsContainerProps) {
  return (
    <>
      <JobModal
        isOpen={props.jobModal}
        editingJob={props.editingJob}
        form={props.newJob}
        setForm={props.setNewJob}
        branches={props.branches}
        postingJob={props.postingJob}
        onClose={() => props.setJobModal(false)}
        onSubmit={props.handleSaveJob}
      />

      <CandidateModal
        isOpen={props.candidateModal}
        editingCandidate={props.editingCandidate}
        form={props.newCandidate}
        setForm={props.setNewCandidate}
        candidateFiles={props.candidateFiles}
        setCandidateFiles={props.setCandidateFiles}
        resumeFile={props.resumeFile}
        setResumeFile={props.setResumeFile}
        uploadingResume={props.uploadingResume}
        jobs={props.jobs}
        candidates={props.candidates}
        allCandidates={props.allCandidates || props.candidates}
        employees={props.employees}
        branches={props.branches}
        isHrDivisionBranch={Boolean(props.isHrDivisionBranch || /hr\s*division/i.test(props.userBranchName || "") || props.branches?.some(b => b.id === props.userBranchId && /hr\s*division/i.test(b.name)))}
        onClose={() => props.setCandidateModal(false)}
        onSubmit={props.handleSaveCandidate}
        onMergeCandidate={props.handleMergeCandidate}
      />

      <InterviewModal
        isOpen={props.interviewModal}
        editingInterview={props.editingInterview}
        form={props.newInterview}
        setForm={props.setNewInterview}
        candidates={props.candidates}
        schedulingInterview={props.schedulingInterview}
        onClose={() => props.setInterviewModal(false)}
        onSubmit={props.handleSaveInterview}
      />

      <MoveToOnboardingModal
        isOpen={props.onboardingModal}
        candidate={props.onboardingCandidate}
        branchId={props.onboardingBranchId}
        setBranchId={props.setOnboardingBranchId}
        joinDate={props.onboardingJoinDate}
        setJoinDate={props.setOnboardingJoinDate}
        branches={props.branches}
        jobs={props.jobs}
        moving={props.movingToOnboarding}
        onClose={() => props.setOnboardingModal(false)}
        onSubmit={props.handleMoveToOnboarding}
      />

      <FeedbackModal
        isOpen={props.feedbackModal}
        interview={props.feedbackInterview}
        score={props.feedbackScore}
        setScore={props.setFeedbackScore}
        notes={props.feedbackNotes}
        setNotes={props.setFeedbackNotes}
        saving={props.savingFeedback}
        onClose={() => props.setFeedbackModal(false)}
        onSubmit={props.handleSaveFeedback}
      />

      <CreateHiringRequestModal
        isOpen={props.showRequestModal}
        onClose={() => props.setShowRequestModal(false)}
        form={props.requestForm}
        setForm={props.setRequestForm}
        branches={props.branches}
        departments={props.departments}
        employees={props.employees}
        submitting={props.submittingRequest}
        onSubmit={props.handleCreateRequest}
        isSuperAdmin={props.isSuperAdmin}
        isBranchAdmin={props.isBranchAdmin}
        userBranchId={props.userBranchId}
        userBranchName={props.userBranchName}
        targetBranch={props.targetBranch}
      />

      <DecisionHiringRequestModal
        isOpen={props.decisionModal}
        onClose={() => props.setDecisionModal(false)}
        request={props.targetRequest}
        action={props.decisionAction}
        reason={props.rejectionReason}
        setReason={props.setRejectionReason}
        processing={props.processingDecision}
        onSubmit={props.handleDecision}
      />
    </>
  );
});
