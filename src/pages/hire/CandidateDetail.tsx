import { useMemo, useState, useEffect, useCallback, useRef } from "react";
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
import { CandidateProcessTracker } from "./components/candidate-detail/CandidateProcessTracker";
import { CandidateActionsWidget } from "./components/candidate-detail/CandidateActionsWidget";
import { InterviewModal } from "./components/modals/InterviewModal";
import { FeedbackModal } from "./components/modals/FeedbackModal";
import { InterviewEvaluationModal } from "./components/candidate-detail/InterviewEvaluationModal";
import { CandidateApprovalModal } from "./components/candidate-detail/CandidateApprovalModal";
import { CandidateOfferLifecycleCard } from "./components/candidate-detail/CandidateOfferLifecycleCard";
import { EmployeeDocumentPortalCard } from "./components/candidate-detail/EmployeeDocumentPortalCard";
import { CandidateContractLifecycleCard } from "./components/contracts/CandidateContractLifecycleCard";
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

export type CandidateDetailTab = "profile" | "documents" | "offer_contract" | "evidence_interviews" | "all";

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { effectiveBranchName } = useBranchScope();
  const isCurrentScopeHr = isHrDivisionScope(effectiveBranchName);
  const {
    candidate,
    setCandidate,
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

  // Tabbed Workspace State
  const [activeTab, setActiveTab] = useState<CandidateDetailTab>(() => {
    const rawTab = searchParams.get("tab");
    if (rawTab === "documents" || rawTab === "files") return "documents";
    if (rawTab === "offer" || rawTab === "offers" || rawTab === "contract" || searchParams.get("openOffer") === "true") return "offer_contract";
    if (rawTab === "evidence" || rawTab === "interviews" || rawTab === "approval") return "evidence_interviews";
    if (rawTab === "all") return "all";
    if (rawTab === "profile") return "profile";
    return "profile";
  });

  const handleSelectTab = useCallback(
    (tab: CandidateDetailTab) => {
      setActiveTab(tab);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === "profile") {
            next.delete("tab");
          } else {
            next.set("tab", tab);
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Synchronize tab if stage or URL param changes
  useEffect(() => {
    if (isOfferRequested) {
      setActiveTab("offer_contract");
    }
  }, [isOfferRequested]);

  useEffect(() => {
    const rawTab = searchParams.get("tab");
    if (!rawTab && candidate && ["offer", "contract", "salary_negotiation"].includes(candidate.stage)) {
      setActiveTab("offer_contract");
    }
  }, [candidate?.stage, searchParams]);

  const docCount = useMemo(() => {
    let count = candidate?.documents?.length || (candidate?.resume_url ? 1 : 0);
    if (candidate?.employee_documents) {
      count += Object.keys(candidate.employee_documents).length;
    }
    return count;
  }, [candidate?.documents, candidate?.resume_url, candidate?.employee_documents]);

  const hasOfferOrContract = useMemo(() => {
    return Boolean(
      activeOffer ||
        ["salary_negotiation", "offer", "accepted", "rejected", "contract", "documents", "hired"].includes(
          candidate?.stage || ""
        )
    );
  }, [activeOffer, candidate?.stage]);

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
      rejectionReason?: string,
      signedDoc?: { name: string; url: string; size?: number; type?: string }
    ) => {
      try {
        const updated = await recordCandidateDecision(offer, decision, notes, rejectionReason, signedDoc);
        setActiveOffer(updated);
        setWorkflowModalType(null);
        await updateStage(decision);

        if (candidate) {
          const newDoc: CandidateDocument = {
            name: signedDoc?.name
              ? `Signed Offer Acceptance - ${offer.offer_number} (${signedDoc.name})`
              : `Signed Offer Acceptance - ${offer.offer_number}`,
            url: signedDoc?.url || `#offer-decision-${offer.offer_number}`,
            size: signedDoc?.size || 0,
            type: signedDoc?.type || "application/pdf",
            uploaded_at: new Date().toISOString(),
            stage_key: decision,
          };
          const existing = (candidate.documents || []).filter(
            (d) => !d.name.includes(offer.offer_number) && d.stage_key !== decision
          );
          candidate.documents = [...existing, newDoc];
        }

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
    [candidate, updateStage]
  );

  const handleExportPdf = useCallback((offer: OfferLetter) => {
    exportOfferLetterPdf(offer);
  }, []);

  const handleExportWord = useCallback(async (offer: OfferLetter) => {
    try {
      await exportOfferLetterWord(offer);
      toast("Word Exported", `Offer letter for ${offer.candidate_name} downloaded as .`, "success");
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

      {/* Recruitment Process Funnel Progression (4 Strategic Phases & Step Guidance) */}
      <CandidateProcessTracker
        candidate={candidate}
        interviews={interviews}
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
        onOpenCandidateApproval={() => setCandidateApprovalModal(true)}
        onOpenSalaryProposal={() => setIsSalaryProposalModal(true)}
      />

      {/* Main 2-Column Grid (Left: 66%, Right: 33%) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Primary Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Segmented Workspace Navigation Tabs */}
          <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-gray-200/80 p-1.5 shadow-xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* Tab 1: Profile & History */}
            <button
              type="button"
              onClick={() => handleSelectTab("profile")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#253C7D] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
              }`}
            >
              <i className="ri-user-3-line text-sm" />
              <span>Profile &amp; History</span>
            </button>

            {/* Tab 2: Documents & Files */}
            <button
              type="button"
              onClick={() => handleSelectTab("documents")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "documents"
                  ? "bg-[#253C7D] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
              }`}
            >
              <i className="ri-folder-open-line text-sm" />
              <span>Documents &amp; Files</span>
              {docCount > 0 && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    activeTab === "documents"
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {docCount}
                </span>
              )}
            </button>

            {/* Tab 3: Offer & Contract */}
            <button
              type="button"
              onClick={() => handleSelectTab("offer_contract")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "offer_contract"
                  ? "bg-[#253C7D] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
              }`}
            >
              <i className="ri-file-shield-2-line text-sm" />
              <span>Offer &amp; Contract</span>
              {hasOfferOrContract && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full flex items-center gap-1 ${
                    activeTab === "offer_contract"
                      ? "bg-emerald-400/25 text-emerald-100"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {candidate.stage === "contract"
                      ? "Contract"
                      : activeOffer?.status
                      ? activeOffer.status.replace(/_/g, " ")
                      : "Active"}
                  </span>
                </span>
              )}
            </button>

            {/* Tab 4: Evidence & Interviews */}
            <button
              type="button"
              onClick={() => handleSelectTab("evidence_interviews")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === "evidence_interviews"
                  ? "bg-[#253C7D] text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/70"
              }`}
            >
              <i className="ri-shield-check-line text-sm" />
              <span>Evidence &amp; Interviews</span>
              {interviews.length > 0 && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    activeTab === "evidence_interviews"
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {interviews.length}
                </span>
              )}
            </button>

            {/* Tab 5: All Sections */}
            <button
              type="button"
              onClick={() => handleSelectTab("all")}
              className={`ml-auto px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === "all"
                  ? "bg-gray-800 text-white shadow-xs"
                  : "text-gray-400 hover:text-gray-700 hover:bg-gray-100/70"
              }`}
              title="View all sections together in one continuous page"
            >
              <i className="ri-layout-grid-line text-xs" />
              <span>All in One</span>
            </button>
          </div>

          {/* TAB CONTENT: 1. Profile & History */}
          {(activeTab === "profile" || activeTab === "all") && (
            <>
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
            </>
          )}

          {/* TAB CONTENT: 2. Documents & Files */}
          {(activeTab === "documents" || activeTab === "all") && (
            <>
              {/* 3. Resume & Candidate Documents (AWS S3 & Digital Records) */}
              <CandidateResumeCard
                candidate={candidate}
                uploadingResume={uploadingResume}
                fileInputRef={fileInputRef}
                onUploadResume={uploadResume}
                onUploadDocuments={uploadDocuments}
                onDeleteDocument={deleteDocument}
                activeOffer={activeOffer}
                onExportOfferPdf={handleExportPdf}
                onExportOfferWord={handleExportWord}
              />

              {/* 5. Employee Document Portal (Activated once Offer is Accepted) */}
              {activeOffer?.status === "accepted" ||
              ["accepted", "documents", "contract", "hired"].includes(candidate.stage) ? (
                <EmployeeDocumentPortalCard
                  candidate={candidate}
                  onUploadDocuments={uploadDocuments}
                  onDeleteDocument={deleteDocument}
                  onUpdateCandidate={setCandidate}
                />
              ) : (
                activeTab === "documents" && (
                  <div className="p-5 bg-slate-50 border border-dashed border-gray-200 rounded-2xl text-center text-xs text-gray-500">
                    <i className="ri-information-line mr-1.5 text-blue-600 text-sm align-middle" />
                    Employee Document Portal (National ID, NSSF Card, Family Book, Bank Account) activates once an offer is accepted.
                  </div>
                )
              )}
            </>
          )}

          {/* TAB CONTENT: 3. Offer & Compensation + Employment Contract Lifecycle */}
          {(activeTab === "offer_contract" || activeTab === "all") && (
            <>
              {activeOffer ||
              ["salary_negotiation", "offer", "accepted", "rejected", "contract", "documents", "hired"].includes(
                candidate.stage
              ) ? (
                <>
                  {/* 4. Offer & Compensation Lifecycle Progression (6-Step Sequential Flow) */}
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

                  {/* 5. Employment Contract Lifecycle Card */}
                  {(activeOffer?.status === "accepted" ||
                    ["accepted", "documents", "contract", "hired"].includes(candidate.stage)) && (
                    <CandidateContractLifecycleCard
                      candidate={candidate}
                      activeOffer={activeOffer}
                      actorName={actorName}
                      isCurrentScopeHr={isCurrentScopeHr}
                      onRefreshCandidate={loadCandidateOffer}
                    />
                  )}
                </>
              ) : (
                activeTab === "offer_contract" && (
                  <div className="p-8 bg-white rounded-3xl border border-gray-200/80 text-center shadow-2xs">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-2xl mx-auto mb-3">
                      <i className="ri-file-shield-2-line" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">Offer &amp; Contract Workflow</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
                      Candidate is currently in the{" "}
                      <strong className="capitalize text-gray-800">
                        {candidate.stage.replace(/_/g, " ")}
                      </strong>{" "}
                      stage. When interviews and evaluations are complete, you can generate a salary proposal and employment contract here.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSalaryProposalModal(true)}
                      className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <i className="ri-file-add-line text-sm" />
                      <span>Create Salary Proposal</span>
                    </button>
                  </div>
                )
              )}
            </>
          )}

          {/* TAB CONTENT: 4. Evidence & Interviews */}
          {(activeTab === "evidence_interviews" || activeTab === "all") && (
            <>
              {/* 6. 13-Stage Recruitment Evidence & Verification Matrix */}
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
                    toast(
                      "Access Restricted",
                      "You can only feedback candidates that the recruiter invited you to interview.",
                      "error"
                    );
                    return;
                  }
                  const stageKey = resolveInterviewStageKey(iv, candidate);
                  setSelectedEvaluationInterview(iv);
                  setEvaluationModalStage(stageKey);
                }}
                onUpdateStage={updateStage}
                onOpenCandidateApproval={() => setCandidateApprovalModal(true)}
                onOpenSalaryProposal={() => setIsSalaryProposalModal(true)}
                activeOffer={activeOffer}
                onExportPdf={handleExportPdf}
              />

              {/* 7. Interview History */}
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
                    toast(
                      "Access Restricted",
                      "You can only feedback candidates that the recruiter invited you to interview.",
                      "error"
                    );
                    return;
                  }
                  const stageKey = resolveInterviewStageKey(iv, candidate);
                  setSelectedEvaluationInterview(iv);
                  setEvaluationModalStage(stageKey);
                }}
              />
            </>
          )}
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