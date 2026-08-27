import { useParams, Link } from "react-router-dom";
import { CandidateProfileHeader } from "./components/candidate-detail/CandidateProfileHeader";
import { CandidateTimeline } from "./components/candidate-detail/CandidateTimeline";
import { CandidateInfoCard } from "./components/candidate-detail/CandidateInfoCard";
import { CandidateInterviewsCard } from "./components/candidate-detail/CandidateInterviewsCard";
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
    handleSaveNotes,
    handleSaveFeedback,
    handleScheduleInterview,
    deleteCandidate,
  } = useCandidateDetail(id);

  if (loading && !candidate) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
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
          className="px-5 py-2.5 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all"
        >
          ← Return to Recruitment Hub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans max-w-7xl mx-auto">
      {/* Top Back Breadcrumbs */}
      <div className="mb-4">
        <Link
          to="/hire"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#253C7D] transition-colors"
        >
          <i className="ri-arrow-left-line text-sm" />
          Back to Recruitment Hub
        </Link>
      </div>

      {/* Profile Header */}
      <CandidateProfileHeader
        candidate={candidate}
        onUpdateStage={updateStage}
        onRate={rateCandidate}
        onUploadResume={uploadResume}
        uploadingResume={uploadingResume}
        fileInputRef={fileInputRef}
        onDelete={deleteCandidate}
      />

      {/* Recruitment Progression Timeline */}
      <CandidateTimeline currentStage={candidate.stage} onUpdateStage={updateStage} />

      {/* Main Grid: Application Info & Interview Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CandidateInfoCard
          candidate={candidate}
          isEditingNotes={isEditingNotes}
          setIsEditingNotes={setIsEditingNotes}
          notesText={notesText}
          setNotesText={setNotesText}
          savingNotes={savingNotes}
          onSaveNotes={handleSaveNotes}
        />

        <CandidateInterviewsCard
          interviews={interviews}
          onOpenScheduleModal={() => {
            setNewInterview({
              candidate_id: candidate.id,
              scheduled_at: "",
              duration_minutes: "60",
              type: "video",
              notes: "",
            });
            setScheduleModal(true);
          }}
          onOpenFeedbackModal={(iv) => {
            setFeedbackInterview(iv);
            setFeedbackScore(iv.score || 5);
            setFeedbackText(iv.feedback || "");
          }}
        />
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