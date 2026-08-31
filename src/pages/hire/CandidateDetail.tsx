import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { CandidateProfileHeader } from "./components/candidate-detail/CandidateProfileHeader";
import { CandidateResumeCard } from "./components/candidate-detail/CandidateResumeCard";
import { CandidateInterviewsCard } from "./components/candidate-detail/CandidateInterviewsCard";
import { CandidateNotesCard } from "./components/candidate-detail/CandidateNotesCard";
import { CandidateEvaluationWidget } from "./components/candidate-detail/CandidateEvaluationWidget";
import { CandidateSourceWidget } from "./components/candidate-detail/CandidateSourceWidget";
import { CandidatePipelineWidget } from "./components/candidate-detail/CandidatePipelineWidget";
import { CandidateActionsWidget } from "./components/candidate-detail/CandidateActionsWidget";
import { InterviewModal } from "./components/modals/InterviewModal";
import { FeedbackModal } from "./components/modals/FeedbackModal";
import { useCandidateDetail } from "./hooks/useCandidateDetail";

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
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
    deleteDocument,
    handleSaveNotes,
    handleSaveFeedback,
    handleScheduleInterview,
    deleteCandidate,
  } = useCandidateDetail(id);

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
          {/* 1. Resume & Candidate Documents (AWS S3) */}
          <CandidateResumeCard
            candidate={candidate}
            uploadingResume={uploadingResume}
            fileInputRef={fileInputRef}
            onUploadResume={uploadResume}
            onUploadDocuments={uploadDocuments}
            onDeleteDocument={deleteDocument}
          />

          {/* 2. Interview History */}
          <CandidateInterviewsCard
            interviews={interviews}
            avgScore={avgScore}
            onOpenFeedbackModal={(iv) => {
              setFeedbackInterview(iv);
              setFeedbackScore(iv.score || 5);
              setFeedbackText(iv.feedback || "");
            }}
          />

          {/* 3. Recruiter Notes */}
          <CandidateNotesCard
            candidate={candidate}
            isEditingNotes={isEditingNotes}
            setIsEditingNotes={setIsEditingNotes}
            notesText={notesText}
            setNotesText={setNotesText}
            savingNotes={savingNotes}
            onSaveNotes={handleSaveNotes}
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
            onUpdateStage={updateStage}
          />

          {/* 4. Application Actions */}
          <CandidateActionsWidget
            onUpdateStage={updateStage}
            onDelete={deleteCandidate}
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
    </div>
  );
}