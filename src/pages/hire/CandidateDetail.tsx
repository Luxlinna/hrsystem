import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { CandidateProfileHeader } from "./components/candidate-detail/CandidateProfileHeader";
import { CandidateInfoCard } from "./components/candidate-detail/CandidateInfoCard";
import { CandidateApplicationsCard } from "./components/candidate-detail/CandidateApplicationsCard";
import { CandidateResumeCard } from "./components/candidate-detail/CandidateResumeCard";
import { CandidateEvidenceCard } from "./components/candidate-detail/CandidateEvidenceCard";
import { CandidateInterviewsCard } from "./components/candidate-detail/CandidateInterviewsCard";
import { CandidateEvaluationWidget } from "./components/candidate-detail/CandidateEvaluationWidget";
import { CandidateSourceWidget } from "./components/candidate-detail/CandidateSourceWidget";
import { CandidatePipelineWidget } from "./components/candidate-detail/CandidatePipelineWidget";
import { CandidateActionsWidget } from "./components/candidate-detail/CandidateActionsWidget";
import { InterviewModal } from "./components/modals/InterviewModal";
import { FeedbackModal } from "./components/modals/FeedbackModal";
import { InterviewEvaluationModal } from "./components/candidate-detail/InterviewEvaluationModal";
import { CandidateApprovalModal } from "./components/candidate-detail/CandidateApprovalModal";
import { CandidateOfferLifecycleCard } from "./components/candidate-detail/CandidateOfferLifecycleCard";
import { CreateSalaryProposalModal } from "./components/offers/CreateSalaryProposalModal";
import { OfferWorkflowModal } from "./components/offers/OfferWorkflowModal";
import {
  createSalaryProposal,
  fetchCandidateOffer,
  generateOfferLetterDraft,
  endorseHrReview,
  approveOfferManagement,
  approveByBuCeo,
  approveByHrManager,
  approveByHrDirector,
  authorizeByChairwoman,
  issueOffer,
  recordCandidateDecision,
} from "./services/offerLetterService";
import { exportOfferLetterPdf } from "./exports/exportOfferLetterPdf";
import { exportOfferLetterWord } from "./exports/exportOfferLetterWord";
import { useCandidateDetail } from "./hooks/useCandidateDetail";
import { resolveInterviewStageKey, isUserInvitedToInterview } from "./utils/interviewPanelHelper";
import { toast } from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import { isHrDivisionScope } from "@/services/formLogoService";
import type { WorkflowModalType } from "./hooks/useOfferLetters";
import type { Interview, HiringRequest, CandidateDocument, OfferLetter } from "./types";

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { effectiveBranchName } = useBranchScope();
  const isCurrentScopeHr = isHrDivisionScope(effectiveBranchName);
  const {
    candidate,
    interviews,
    loading,
    uploadingResume,
    isEditingNotes,
    setIsEditingNotes,
    notesText,
    setNotesText,
    savingNotes,
    feedbackInterview,
    setFeedbackInterview,
    feedbackScore,
    setFeedbackScore,
    feedbackText,
    setFeedbackText,
    savingFeedback,
    scheduleModal,
    setScheduleModal,
    schedulingInterview,
    newInterview,
    setNewInterview,
    fileInputRef,
    updateStage,
    rateCandidate,
    uploadResume,
    uploadDocuments,
    uploadStageEvidence,
    deleteDocument,
    handleSaveNotes,
    handleSaveFeedback,
    handleScheduleInterview,
    deleteCandidate,
    handleAddApplication,
    jobs,
    evaluationModalStage,
    setEvaluationModalStage,
    submittingEvaluation,
    handleSubmitInterviewEvaluation,
    openScheduleStageModal,
    actorName,
    isAdminOrRecruiter,
    myEmployeeId,
  } = useCandidateDetail(id);

  const isApprovalRequested = useMemo(() => {
    return (
      searchParams.get("openApproval") === "true" ||
      searchParams.get("openCaf") === "true" ||
      searchParams.get("approval") === "true" ||
      searchParams.get("tab") === "approval"
    );
  }, [searchParams]);

  const isOfferRequested = useMemo(() => {
    return (
      searchParams.get("openOffer") === "true" ||
      searchParams.get("offer") === "true" ||
      searchParams.get("tab") === "offer" ||
      searchParams.get("tab") === "offers"
    );
  }, [searchParams]);

  const [candidateApprovalModal, setCandidateApprovalModal] = useState(false);
  const [selectedEvaluationInterview, setSelectedEvaluationInterview] = useState<Interview | null>(null);
  const [isSalaryProposalModal, setIsSalaryProposalModal] = useState(false);
  const [hiringRequests, setHiringRequests] = useState<HiringRequest[]>([]);

  // Offer Letter Lifecycle State
  const [activeOffer, setActiveOffer] = useState<OfferLetter | null>(null);
  const [workflowModalType, setWorkflowModalType] = useState<WorkflowModalType>(null);
  const autoOpenedOfferRef = useRef(false);

  // Auto-scroll to offer card when openOffer query param is present
  useEffect(() => {
    if (isOfferRequested && candidate) {
      const timer = setTimeout(() => {
        const el = document.getElementById("candidate-offer-lifecycle-card");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isOfferRequested, candidate]);

  // Auto-open actionable workflow modal when routed from notification
  useEffect(() => {
    if (isOfferRequested && candidate && !autoOpenedOfferRef.current) {
      if (activeOffer) {
        autoOpenedOfferRef.current = true;
        if (
          activeOffer.status === "pending_bu_ceo" ||
          (activeOffer.status === "salary_proposal" && !activeOffer.salary_approved_by)
        ) {
          setWorkflowModalType("bu_ceo_approval");
        } else if (
          activeOffer.status === "pending_hr_manager" ||
          activeOffer.status === "draft_letter" ||
          activeOffer.status === "hr_review"
        ) {
          setWorkflowModalType("hr_manager_approval");
        } else if (activeOffer.status === "pending_hr_director") {
          setWorkflowModalType("hr_director_approval");
        } else if (
          activeOffer.status === "pending_chairwoman" ||
          activeOffer.status === "management_approval"
        ) {
          setWorkflowModalType("chairwoman_approval");
        } else if (
          activeOffer.status === "approved" ||
          activeOffer.status === "salary_approved"
        ) {
          setWorkflowModalType("issue_offer");
        }
      }
    }
  }, [isOfferRequested, candidate, activeOffer]);

  const loadCandidateOffer = useCallback(async () => {
    if (!candidate?.id) return;
    try {
      const off = await fetchCandidateOffer(candidate.id);
      setActiveOffer(off);
    } catch {
      // Ignore
    }
  }, [candidate?.id]);

  useEffect(() => {
    loadCandidateOffer();
  }, [loadCandidateOffer]);

  useEffect(() => {
    supabase
      .from("hiring_requests")
      .select("*, branches(name)")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setHiringRequests(data as unknown as HiringRequest[]);
      });
  }, []);

  const handleCreateSalaryProposal = useCallback(
    async (payload: any) => {
      try {
        const created = await createSalaryProposal({
          ...payload,
          proposed_by_name: actorName,
        });

        if (candidate) {
          const newDoc: CandidateDocument = {
            name: `Salary Proposal - ${created.offer_number}`,
            url: `#offer-${created.offer_number}`,
            size: 1024,
            type: "application/pdf",
            uploaded_at: new Date().toISOString(),
            stage_key: "salary_negotiation",
            notes: `Base: $${Number(payload.base_salary).toLocaleString()} • Target Start: ${payload.target_start_date}`,
          };
          const existingDocs = (candidate.documents || []).filter((d) => d.stage_key !== "salary_negotiation");
          const updatedDocs = [...existingDocs, newDoc];

          await supabase
            .from("candidates")
            .update({
              documents: updatedDocs,
              expected_salary: Number(payload.base_salary),
            })
            .eq("id", candidate.id);

          candidate.documents = updatedDocs;
          candidate.expected_salary = Number(payload.base_salary);
        }

        setActiveOffer(created);
        setIsSalaryProposalModal(false);

        toast(
          "Salary Proposal Created",
          `Proposal ${created.offer_number} submitted! Moving to Step 2: Generate Offer Letter.`,
          "success"
        );

        // Right after Salary Proposal: Transition directly to Step 2: Generate Offer Letter (Auto-compiled, no retyping)
        setWorkflowModalType("generate_draft");
      } catch (err: any) {
        console.error("Failed to create salary proposal:", err);
        toast("Error", "Could not create salary proposal.", "error");
        throw err;
      }
    },
    [actorName, candidate]
  );

  const handleGenerateDraft = useCallback(
    async (offer: OfferLetter) => {
      try {
        const updated = await generateOfferLetterDraft(offer);
        setActiveOffer(updated);
        if (isCurrentScopeHr) {
          setWorkflowModalType("hr_review");
          toast(
            "Offer Letter Generated",
            "Generated directly from candidate & requisition records (no retyping required). Opening HR Manager Review...",
            "success"
          );
        } else {
          setWorkflowModalType(null);
          toast(
            "Sent to HR Division",
            "Offer letter draft generated and sent across to the HR Division for review. Your BU action is complete.",
            "success"
          );
        }
      } catch {
        toast("Error", "Failed to generate offer letter draft.", "error");
      }
    },
    [isCurrentScopeHr]
  );

  const handleEndorseHrReview = useCallback(
    async (offer: OfferLetter, notes?: string) => {
      try {
        const updated = await endorseHrReview(offer, actorName, notes);
        setActiveOffer(updated);
        setWorkflowModalType(null);
        toast(
          "HR Review Endorsed",
          `Offer letter endorsed by ${actorName} and forwarded for final management approval.`,
          "success"
        );
      } catch {
        toast("Error", "Failed to endorse HR review.", "error");
      }
    },
    [actorName]
  );

  const handleApproveManagement = useCallback(
    async (offer: OfferLetter, notes?: string) => {
      try {
        const updated = await approveOfferManagement(offer, actorName, notes);
        setActiveOffer(updated);
        setWorkflowModalType(null);
        toast(
          "Offer Authorized & Approved",
          "Executive sign-off complete. Offer is authorized for issuance.",
          "success"
        );
      } catch {
        toast("Error", "Failed to approve offer.", "error");
      }
    },
    [actorName]
  );

  const handleApproveBuCeo = useCallback(
    async (offer: OfferLetter, notes?: string) => {
      try {
        const updated = await approveByBuCeo(offer, actorName, notes);
        setActiveOffer(updated);
        setWorkflowModalType(null);
        toast(
          "Approved by BU CEO",
          `Proposal for ${offer.candidate_name} approved by BU CEO and forwarded to HR Division.`,
          "success"
        );
      } catch {
        toast("Error", "Failed to approve salary proposal as BU CEO.", "error");
      }
    },
    [actorName]
  );

  const handleApproveHrManager = useCallback(
    async (offer: OfferLetter, notes?: string) => {
      try {
        const updated = await approveByHrManager(offer, actorName, notes);
        setActiveOffer(updated);
        setWorkflowModalType(null);
        toast(
          "HR Manager Approved",
          `Offer review endorsed. Forwarded to HR Admin Director.`,
          "success"
        );
      } catch {
        toast("Error", "Failed to complete HR Manager review.", "error");
      }
    },
    [actorName]
  );

  const handleApproveHrDirector = useCallback(
    async (offer: OfferLetter, notes?: string) => {
      try {
        const updated = await approveByHrDirector(offer, actorName, notes);
        setActiveOffer(updated);
        setWorkflowModalType(null);
        toast(
          "HR Admin Director Authorized",
          `Offer authorized. Forwarded to Chairwoman.`,
          "success"
        );
      } catch {
        toast("Error", "Failed to authorize offer as HR Admin Director.", "error");
      }
    },
    [actorName]
  );

  const handleAuthorizeChairwoman = useCallback(
    async (offer: OfferLetter, notes?: string) => {
      try {
        const updated = await authorizeByChairwoman(offer, actorName, notes);
        setActiveOffer(updated);
        setWorkflowModalType(null);
        toast(
          "Offer Fully Authorized",
          `Chairwoman supreme sign-off granted. Offer is authorized to be issued.`,
          "success"
        );
      } catch {
        toast("Error", "Failed to authorize offer as Chairwoman.", "error");
      }
    },
    [actorName]
  );

  const handleIssueOffer = useCallback(
    async (offer: OfferLetter, expiryDate?: string) => {
      try {
        const updated = await issueOffer(offer, actorName, expiryDate);
        setActiveOffer(updated);
        setWorkflowModalType(null);
        await updateStage("offer");
        toast(
          "Offer Officially Issued",
          `Offer letter issued to ${offer.candidate_name}. Pipeline stage updated to Offer.`,
          "success"
        );
        exportOfferLetterPdf(updated);
      } catch {
        toast("Error", "Failed to issue offer letter.", "error");
      }
    },
    [actorName, updateStage]
  );

  const handleRecordDecision = useCallback(
    async (
      offer: OfferLetter,
      decision: "accepted" | "rejected",
      notes?: string,
      rejectionReason?: string
    ) => {
      try {
        const updated = await recordCandidateDecision(offer, decision, notes, rejectionReason);
        setActiveOffer(updated);
        setWorkflowModalType(null);
        await updateStage(decision);
        toast(
          decision === "accepted" ? "Offer Accepted!" : "Offer Declined",
          decision === "accepted"
            ? `${offer.candidate_name} accepted the offer! Candidate stage updated to Accepted.`
            : `Offer marked as declined: ${rejectionReason || "None specified"}.`,
          decision === "accepted" ? "success" : "info"
        );
      } catch {
        toast("Error", "Failed to record candidate decision.", "error");
      }
    },
    [updateStage]
  );

  const handleExportPdf = useCallback((offer: OfferLetter) => {
    exportOfferLetterPdf(offer);
  }, []);

  const handleExportWord = useCallback(async (offer: OfferLetter) => {
    try {
      await exportOfferLetterWord(offer);
      toast("Word Exported", `Offer letter for ${offer.candidate_name} downloaded as Word (.docx).`, "success");
    } catch {
      toast("Export Error", "Failed to generate Word document.", "error");
    }
  }, []);

  useEffect(() => {
    if (isApprovalRequested && candidate) {
      setCandidateApprovalModal(true);
    }
  }, [isApprovalRequested, candidate]);

  const handleCloseApprovalModal = useCallback(() => {
    setCandidateApprovalModal(false);
    if (isApprovalRequested) {
      const next = new URLSearchParams(searchParams);
      next.delete("openApproval");
      next.delete("openCaf");
      next.delete("approval");
      if (next.get("tab") === "approval") next.delete("tab");
      setSearchParams(next, { replace: true });
    }
  }, [isApprovalRequested, searchParams, setSearchParams]);

  const handleCloseWorkflowModal = useCallback(() => {
    setWorkflowModalType(null);
    if (isOfferRequested) {
      const next = new URLSearchParams(searchParams);
      next.delete("openOffer");
      next.delete("offer");
      if (next.get("tab") === "offer" || next.get("tab") === "offers") next.delete("tab");
      setSearchParams(next, { replace: true });
    }
  }, [isOfferRequested, searchParams, setSearchParams]);

  const avgScore = useMemo(() => {
    const scored = interviews.filter((i) => (i.score || 0) > 0);
    if (scored.length === 0) return 5.0;
    return scored.reduce((sum, i) => sum + (i.score || 0), 0) / scored.length;
  }, [interviews]);

  if (loading && !candidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#172B4D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading candidate profile...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-8 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gray-100 rounded-3xl flex items-center justify-center text-2xl text-gray-400 mb-4">
          <i className="ri-user-unfollow-line" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Candidate Not Found</h2>
        <p className="text-xs text-gray-400 mt-1 mb-6">
          The requested candidate profile may have been removed or moved to the Recycle Bin.
        </p>
        <Link
          to="/hire"
          className="px-5 py-2.5 bg-[#172B4D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#0f1d35] transition-all"
        >
          ← Return to Recruitment Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans max-w-7xl mx-auto">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-5">
        <Link to="/" className="hover:text-[#172B4D] transition-colors">
          Dashboard
        </Link>
        <span>›</span>
        <Link to="/hire" className="hover:text-[#172B4D] transition-colors">
          Recruitment Hub
        </Link>
        <span>›</span>
        <span className="text-gray-900 font-bold capitalize">{candidate.full_name}</span>
      </div>

      {/* Top Profile Header Card */}
      <CandidateProfileHeader
        candidate={candidate}
        onUpdateStage={updateStage}
        onOpenSchedule={() => {
          setNewInterview({
            candidate_id: candidate.id,
            scheduled_at: "",
            duration_minutes: "60",
            type: "video",
            notes: "",
          });
          setScheduleModal(true);
        }}
      />

      {/* Main 2-Column Grid (Left: 66%, Right: 33%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Primary Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Master Profile Details & Recruiter Notes */}
          <CandidateInfoCard
            candidate={candidate}
            isEditingNotes={isEditingNotes}
            setIsEditingNotes={setIsEditingNotes}
            notesText={notesText}
            setNotesText={setNotesText}
            savingNotes={savingNotes}
            onSaveNotes={handleSaveNotes}
          />

          {/* 2. Full Candidate History & Multi-Application Track */}
          <CandidateApplicationsCard
            candidate={candidate}
            jobs={jobs}
            onAddApplication={handleAddApplication}
          />

          {/* 3. Resume & Candidate Documents (AWS S3) */}
          <CandidateResumeCard
            candidate={candidate}
            uploadingResume={uploadingResume}
            fileInputRef={fileInputRef}
            onUploadResume={uploadResume}
            onUploadDocuments={uploadDocuments}
            onDeleteDocument={deleteDocument}
          />

          {/* 4. Offer & Compensation Lifecycle Progression (6-Step Sequential Flow) */}
          {(activeOffer || ["salary_negotiation", "offer", "accepted", "rejected"].includes(candidate.stage)) && (
            <CandidateOfferLifecycleCard
              candidate={candidate}
              offer={activeOffer}
              onOpenCreateProposal={() => setIsSalaryProposalModal(true)}
              onGenerateDraft={handleGenerateDraft}
              onOpenWorkflowModal={(off, type) => {
                setActiveOffer(off);
                setWorkflowModalType(type);
              }}
              onExportPdf={handleExportPdf}
              onExportWord={handleExportWord}
            />
          )}

          {/* 5. 13-Stage Recruitment Evidence & Verification Matrix */}
          <CandidateEvidenceCard
            candidate={candidate}
            interviews={interviews}
            uploading={uploadingResume}
            onUploadStageEvidence={uploadStageEvidence}
            onOpenEvaluationForm={(stageKey) => {
              setSelectedEvaluationInterview(null);
              setEvaluationModalStage(stageKey);
            }}
            onScheduleStageInterview={openScheduleStageModal}
            onOpenFeedbackModal={(iv) => {
              const canFeedback = isUserInvitedToInterview({
                interview: iv,
                candidate,
                myEmployeeId,
                actorName,
                isAdminOrRecruiter,
              });
              if (!canFeedback) {
                toast("Access Restricted", "You can only feedback candidates that the recruiter invited you to interview.", "error");
                return;
              }
              const stageKey = resolveInterviewStageKey(iv, candidate);
              setSelectedEvaluationInterview(iv);
              setEvaluationModalStage(stageKey);
            }}
            onUpdateStage={updateStage}
            onOpenCandidateApproval={() => setCandidateApprovalModal(true)}
            onOpenSalaryProposal={() => setIsSalaryProposalModal(true)}
          />

          {/* 6. Interview History */}
          <CandidateInterviewsCard
            interviews={interviews}
            avgScore={avgScore}
            candidate={candidate}
            myEmployeeId={myEmployeeId}
            actorName={actorName}
            isAdminOrRecruiter={isAdminOrRecruiter}
            onOpenFeedbackModal={(iv) => {
              const canFeedback = isUserInvitedToInterview({
                interview: iv,
                candidate,
                myEmployeeId,
                actorName,
                isAdminOrRecruiter,
              });
              if (!canFeedback) {
                toast("Access Restricted", "You can only feedback candidates that the recruiter invited you to interview.", "error");
                return;
              }
              const stageKey = resolveInterviewStageKey(iv, candidate);
              setSelectedEvaluationInterview(iv);
              setEvaluationModalStage(stageKey);
            }}
          />
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* 1. Candidate Star Evaluation */}
          <CandidateEvaluationWidget
            rating={candidate.rating || 0}
            onRate={rateCandidate}
          />

          {/* 2. Sourcing Channel */}
          <CandidateSourceWidget source={candidate.source} />

          {/* 3. Pipeline Timeline (Vertical Stepper) */}
          <CandidatePipelineWidget
            currentStage={candidate.stage}
            candidate={candidate}
            interviews={interviews}
            onUpdateStage={updateStage}
            onOpenCandidateApproval={() => setCandidateApprovalModal(true)}
            onOpenSalaryProposal={() => setIsSalaryProposalModal(true)}
          />

          {/* 4. Application Actions */}
          <CandidateActionsWidget
            currentStage={candidate.stage}
            onUpdateStage={updateStage}
            onDelete={deleteCandidate}
            onOpenCandidateApproval={() => setCandidateApprovalModal(true)}
            onOpenSalaryProposal={() => setIsSalaryProposalModal(true)}
            activeOffer={activeOffer}
            onOpenOfferWorkflow={(type) => setWorkflowModalType(type)}
            onExportPdf={handleExportPdf}
          />
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <InterviewModal
        isOpen={scheduleModal}
        editingInterview={null}
        form={newInterview}
        setForm={setNewInterview}
        candidates={[candidate]}
        schedulingInterview={schedulingInterview}
        onClose={() => setScheduleModal(false)}
        onSubmit={handleScheduleInterview}
      />

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={Boolean(feedbackInterview)}
        interview={feedbackInterview}
        score={feedbackScore}
        setScore={setFeedbackScore}
        notes={feedbackText}
        setNotes={setFeedbackText}
        saving={savingFeedback}
        onClose={() => setFeedbackInterview(null)}
        onSubmit={handleSaveFeedback}
      />

      {/* Dedicated Interview Evaluation Form Modal (Mandatory Evidence for HR, Hiring Manager, Final Interview) */}
      <InterviewEvaluationModal
        isOpen={Boolean(evaluationModalStage)}
        stageKey={evaluationModalStage}
        candidate={candidate}
        interviews={interviews}
        targetInterview={selectedEvaluationInterview}
        defaultEvaluatorName={actorName}
        canUserFeedback={isUserInvitedToInterview({
          interview: selectedEvaluationInterview || (interviews.find((i) => (i.notes || "").includes(evaluationModalStage || ""))),
          candidate,
          myEmployeeId,
          actorName,
          isAdminOrRecruiter,
        })}
        onClose={() => {
          setEvaluationModalStage(null);
          setSelectedEvaluationInterview(null);
        }}
        onSubmitEvaluation={async (payload) => {
          await handleSubmitInterviewEvaluation({
            ...payload,
            interviewId: selectedEvaluationInterview?.id,
          });
          setSelectedEvaluationInterview(null);
        }}
        submitting={submittingEvaluation}
      />

      {/* Candidate Approval Form Modal (CAF) */}
      <CandidateApprovalModal
        isOpen={candidateApprovalModal}
        candidate={candidate}
        interviews={interviews}
        currentUserName={actorName}
        onClose={handleCloseApprovalModal}
        onAdvanceStage={async (nextStage) => {
          await updateStage(nextStage);
        }}
      />

      {/* Salary Proposal / Negotiation Form Modal */}
      <CreateSalaryProposalModal
        isOpen={isSalaryProposalModal}
        onClose={() => setIsSalaryProposalModal(false)}
        candidate={candidate}
        candidates={candidate ? [candidate] : []}
        hiringRequests={hiringRequests}
        existingOffers={activeOffer ? [activeOffer] : []}
        onSubmit={handleCreateSalaryProposal}
      />

      {/* Offer Letter Lifecycle Action Modal */}
      <OfferWorkflowModal
        isOpen={Boolean(activeOffer && workflowModalType)}
        onClose={handleCloseWorkflowModal}
        offer={activeOffer}
        modalType={workflowModalType}
        actorName={actorName}
        onApproveBuCeo={handleApproveBuCeo}
        onApproveHrManager={handleApproveHrManager}
        onApproveHrDirector={handleApproveHrDirector}
        onAuthorizeChairwoman={handleAuthorizeChairwoman}
        onGenerateDraft={handleGenerateDraft}
        onEndorseHrReview={handleEndorseHrReview}
        onApproveManagement={handleApproveManagement}
        onIssueOffer={handleIssueOffer}
        onRecordDecision={handleRecordDecision}
        onExportPdf={handleExportPdf}
        onExportWord={handleExportWord}
      />
    </div>
  );
}