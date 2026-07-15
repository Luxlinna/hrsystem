import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import app from "@/lib/firebase";

interface OnboardingRequest {
  id: string;
  employee_id: string;
  branch_id: string;
  stage: string;
  day_count: number;
  status: string;
  requested_by: string;
  created_at: string;
  employees?: {
    first_name: string;
    last_name: string;
    role: string;
    department: string;
    branches?: { name: string } | null;
  } | null;
}

interface OnboardingDoc {
  id: string;
  onboarding_request_id: string;
  document_name: string;
  document_type: string;
  stage: string;
  status: string;
  file_url: string | null;
  file_name: string | null;
  notes: string | null;
  uploaded_at: string;
}

const STAGES = [
  { key: "document", label: "Document Collection", description: "Offer letter, ID verification, contracts, bank forms" },
  { key: "it_setup", label: "IT Setup", description: "Laptop, accounts, email, access provisioning" },
  { key: "training", label: "Training & Orientation", description: "HR orientation, team intro, role-specific training" },
  { key: "complete", label: "Complete", description: "Final review, checklist sign-off, go-live" },
];

const DOCUMENT_TEMPLATES: Record<string, string[]> = {
  document: ["Offer Letter", "ID Verification", "Employment Contract", "Bank Details Form", "NDA Agreement"],
  it_setup: ["Laptop Assignment", "Email Account Setup", "VPN Access Request", "Software Licenses", "Security Access Badge"],
  training: ["HR Orientation Checklist", "Team Introduction", "Role Training Schedule", "Company Handbook Acknowledgment"],
  complete: ["Onboarding Sign-off", "Probation Review Form", "Feedback Survey"],
};

export default function Onboarding() {
  const [requests, setRequests] = useState<OnboardingRequest[]>([]);
  const [documents, setDocuments] = useState<OnboardingDoc[]>([]);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<OnboardingRequest | null>(null);
  const [selectedStage, setSelectedStage] = useState("");
  const [docForm, setDocForm] = useState({ document_name: "", notes: "" });
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [filter, setFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const storage = getStorage(app);

  const loadData = async () => {
    const [{ data: ob }, { data: docs }] = await Promise.all([
      supabase.from("onboarding_requests").select("*, employees(first_name, last_name, role, department, branch_id, branches(name))").order("created_at", { ascending: false }),
      supabase.from("onboarding_documents").select("*").order("created_at", { ascending: true }),
    ]);
    setRequests(ob || []);
    setDocuments(docs || []);
  };

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("onboarding-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_requests" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "onboarding_documents" }, () => loadData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const getDocsForRequestAndStage = (reqId: string, stage: string) =>
    documents.filter((d) => d.onboarding_request_id === reqId && d.stage === stage);

  const getStageProgress = (reqId: string, stage: string) => {
    const docs = getDocsForRequestAndStage(reqId, stage);
    if (docs.length === 0) return 0;
    return Math.round((docs.filter((d) => d.status === "complete").length / docs.length) * 100);
  };

  const isStageComplete = (reqId: string, stage: string) => {
    const docs = getDocsForRequestAndStage(reqId, stage);
    return docs.length > 0 && docs.every((d) => d.status === "complete");
  };

  const openDocModal = (req: OnboardingRequest, stage: string) => {
    setSelectedRequest(req);
    setSelectedStage(stage);
    setDocForm({ document_name: "", notes: "" });
    setShowDocModal(true);
  };

  const handleDocUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !selectedStage || !docForm.document_name) return;

    setUploading(true);
    const file = fileInputRef.current?.files?.[0];
    let fileUrl = null;
    let fileName = null;

    if (file) {
      try {
        const storageRef = ref(storage, `onboarding/${selectedRequest.id}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        fileUrl = await getDownloadURL(storageRef);
        fileName = file.name;
      } catch {
        setToast({ type: "error", message: "File upload failed" });
        setUploading(false);
        return;
      }
    }

    const { error } = await supabase.from("onboarding_documents").insert({
      onboarding_request_id: selectedRequest.id,
      employee_id: selectedRequest.employee_id,
      document_name: docForm.document_name,
      stage: selectedStage,
      status: fileUrl ? "complete" : "pending",
      file_url: fileUrl,
      file_name: fileName,
      notes: docForm.notes || null,
    });

    setUploading(false);
    setShowDocModal(false);

    if (error) {
      setToast({ type: "error", message: "Failed to add document" });
    } else {
      setToast({ type: "success", message: "Document added successfully" });
      setDocForm({ document_name: "", notes: "" });
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleDocStatus = async (doc: OnboardingDoc) => {
    const newStatus = doc.status === "complete" ? "pending" : "complete";
    const { error } = await supabase.from("onboarding_documents").update({ status: newStatus }).eq("id", doc.id);
    if (error) {
      setToast({ type: "error", message: "Failed to update status" });
    } else {
      setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, status: newStatus } : d)));
      setToast({ type: "success", message: `Marked ${newStatus}` });
    }
  };

  const advanceStage = async (req: OnboardingRequest) => {
    const currentIndex = STAGES.findIndex((s) => s.key === req.stage);
    const nextStage = STAGES[currentIndex + 1]?.key || "complete";
    const { error } = await supabase.from("onboarding_requests").update({ stage: nextStage }).eq("id", req.id);
    if (error) {
      setToast({ type: "error", message: "Failed to advance stage" });
    } else {
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, stage: nextStage } : r)));
      setToast({ type: "success", message: `Advanced to ${STAGES.find((s) => s.key === nextStage)?.label || "Complete"}` });
    }
  };

  const completeOnboarding = async (req: OnboardingRequest) => {
    const { error } = await supabase.from("onboarding_requests").update({ status: "completed", stage: "complete" }).eq("id", req.id);
    if (error) {
      setToast({ type: "error", message: "Failed to complete onboarding" });
    } else {
      setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: "completed", stage: "complete" } : r)));
      setToast({ type: "success", message: "Onboarding completed" });
    }
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const stats = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    completed: requests.filter((r) => r.status === "completed").length,
    total: requests.length,
    inProgress: requests.filter((r) => r.status === "approved" && r.stage !== "complete").length,
  };

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-[13px] font-medium text-white ${
          toast.type === "success" ? "bg-[#0D7377]" : "bg-red-500"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Employee Onboarding</h1>
          <p className="text-[13px] text-gray-500 mt-1">Track and manage new hire onboarding across all branches with stage-based checklist</p>
        </div>
        <button
          onClick={() => setShowStartModal(true)}
          className="inline-flex items-center gap-2 bg-[#0D7377] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors whitespace-nowrap"
        >
          <i className="ri-user-add-line" />
          Start Onboarding
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Pending", count: stats.pending, color: "bg-amber-50 text-amber-700" },
          { label: "Approved", count: stats.approved, color: "bg-blue-50 text-blue-700" },
          { label: "In Progress", count: stats.inProgress, color: "bg-[#0D7377]/10 text-[#0D7377]" },
          { label: "Completed", count: stats.completed, color: "bg-green-50 text-green-700" },
          { label: "Total", count: stats.total, color: "bg-gray-50 text-gray-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.count}</p>
            <p className="text-[12px] font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["all", "pending", "approved", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-[12px] font-medium capitalize transition-colors ${
              filter === f ? "bg-[#0D7377] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f}
            {f !== "all" && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                {requests.filter((r) => r.status === f).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Onboarding Cards */}
      <div className="space-y-4">
        {filtered.map((req) => {
          const isExpanded = expandedRequest === req.id;
          const currentStageIndex = STAGES.findIndex((s) => s.key === req.stage);
          const overallProgress = Math.round(((currentStageIndex) / (STAGES.length - 1)) * 100);

          return (
            <div key={req.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
              {/* Header Row */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#0D7377]/10 flex items-center justify-center text-[#0D7377] font-bold text-sm">
                    {req.employees?.first_name?.[0]}{req.employees?.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-gray-900">{req.employees?.first_name} {req.employees?.last_name}</p>
                    <p className="text-[12px] text-gray-500">{req.employees?.role || "New Hire"} — {req.employees?.branches?.name || "Headquarters"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${
                    req.status === "pending" ? "bg-amber-50 text-amber-700" :
                    req.status === "approved" ? "bg-blue-50 text-blue-700" :
                    "bg-green-50 text-green-700"
                  }`}>
                    {req.status}
                  </span>
                  <span className="text-[11px] text-gray-500">Day {req.day_count}</span>
                  <button
                    onClick={() => setExpandedRequest(isExpanded ? null : req.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                  >
                    {isExpanded ? (
                      <i className="ri-arrow-up-s-line text-lg" />
                    ) : (
                      <i className="ri-arrow-down-s-line text-lg" />
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="px-5 pb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-gray-500">Overall Progress</span>
                  <span className="text-[11px] font-semibold text-[#0D7377]">{overallProgress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0D7377] rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
                </div>
              </div>

              {/* Stage Pipeline (visible always) */}
              <div className="px-5 pb-4">
                <div className="flex items-center gap-1">
                  {STAGES.map((stage, i) => {
                    const stageIndex = STAGES.findIndex((s) => s.key === req.stage);
                    const isDone = i < stageIndex;
                    const isCurrent = i === stageIndex;
                    const isComplete = isStageComplete(req.id, stage.key);
                    return (
                      <div key={stage.key} className="flex items-center flex-1">
                        <div
                          className={`flex-1 h-2 rounded-full transition-colors ${
                            isDone || isCurrent ? "bg-[#0D7377]" : "bg-gray-100"
                          }`}
                        />
                        {i < STAGES.length - 1 && (
                          <div className={`w-3 h-0.5 ${isDone ? "bg-[#0D7377]" : "bg-gray-100"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1">
                  {STAGES.map((s) => (
                    <span key={s.key} className="text-[10px] text-gray-400 w-1/4 text-center">{s.label}</span>
                  ))}
                </div>
              </div>

              {/* Expanded Stage Checklist */}
              {isExpanded && (
                <div className="border-t border-gray-100 bg-gray-50/50">
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STAGES.map((stage) => {
                      const stageDocs = getDocsForRequestAndStage(req.id, stage.key);
                      const progress = getStageProgress(req.id, stage.key);
                      const isCurrent = stage.key === req.stage;
                      const isDone = STAGES.findIndex((s) => s.key === req.stage) > STAGES.findIndex((s) => s.key === stage.key);

                      return (
                        <div
                          key={stage.key}
                          className={`bg-white rounded-xl border p-4 ${
                            isCurrent ? "border-[#0D7377] ring-1 ring-[#0D7377]/10" : "border-gray-100"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                                isDone ? "bg-[#0D7377] text-white" :
                                isCurrent ? "bg-[#0D7377]/10 text-[#0D7377]" :
                                "bg-gray-100 text-gray-400"
                              }`}>
                                {isDone ? <i className="ri-check-line" /> : STAGES.findIndex((s) => s.key === stage.key) + 1}
                              </span>
                              <span className={`text-[12px] font-semibold ${isCurrent ? "text-[#0D7377]" : "text-gray-700"}`}>
                                {stage.label}
                              </span>
                            </div>
                            {isCurrent && req.status === "approved" && (
                              <button
                                onClick={() => openDocModal(req, stage.key)}
                                className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 hover:text-[#0D7377]"
                              >
                                <i className="ri-add-line" />
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 mb-3">{stage.description}</p>

                          {/* Progress */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] text-gray-500">{stageDocs.filter((d) => d.status === "complete").length}/{stageDocs.length || "0"} complete</span>
                            <span className="text-[11px] font-semibold text-[#0D7377]">{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-[#0D7377] rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>

                          {/* Documents list */}
                          <div className="space-y-1.5">
                            {stageDocs.map((doc) => (
                              <div key={doc.id} className="flex items-center gap-2 group">
                                <button
                                  onClick={() => toggleDocStatus(doc)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                    doc.status === "complete"
                                      ? "bg-[#0D7377] border-[#0D7377] text-white"
                                      : "border-gray-300 hover:border-[#0D7377]"
                                  }`}
                                >
                                  {doc.status === "complete" && <i className="ri-check-line text-[10px]" />}
                                </button>
                                <span className={`text-[11px] flex-1 truncate ${doc.status === "complete" ? "text-gray-400 line-through" : "text-gray-700"}`}>
                                  {doc.document_name}
                                </span>
                                {doc.file_url && (
                                  <a
                                    href={doc.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-[#0D7377] hover:underline"
                                  >
                                    <i className="ri-download-line" />
                                  </a>
                                )}
                              </div>
                            ))}
                            {stageDocs.length === 0 && (
                              <p className="text-[11px] text-gray-300 italic">No documents yet</p>
                            )}
                          </div>

                          {/* Quick-add template docs */}
                          {isCurrent && req.status === "approved" && stageDocs.length === 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-[10px] text-gray-400 mb-1.5">Quick add:</p>
                              <div className="flex flex-wrap gap-1">
                                {DOCUMENT_TEMPLATES[stage.key].slice(0, 3).map((name) => (
                                  <button
                                    key={name}
                                    onClick={() => {
                                      setSelectedRequest(req);
                                      setSelectedStage(stage.key);
                                      setDocForm({ document_name: name, notes: "" });
                                      setShowDocModal(true);
                                    }}
                                    className="px-2 py-1 bg-gray-50 hover:bg-[#0D7377]/5 border border-gray-100 hover:border-[#0D7377]/20 rounded text-[10px] text-gray-600 hover:text-[#0D7377] transition-colors"
                                  >
                                    {name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Advance button */}
                          {isCurrent && isStageComplete(req.id, stage.key) && req.status === "approved" && stage.key !== "complete" && (
                            <button
                              onClick={() => advanceStage(req)}
                              className="mt-3 w-full py-2 bg-[#0D7377] text-white rounded-lg text-[11px] font-semibold hover:bg-[#0a5c60] transition-colors"
                            >
                              Complete & Advance <i className="ri-arrow-right-line ml-1" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  {req.status === "approved" && (
                    <div className="px-5 pb-5 flex gap-3">
                      {req.stage !== "complete" && (
                        <button
                          onClick={() => advanceStage(req)}
                          className="px-4 py-2 bg-[#0D7377] text-white text-[12px] font-semibold rounded-lg hover:bg-[#0a5c60] transition-colors"
                        >
                          Next Stage
                        </button>
                      )}
                      {req.stage === "complete" && (
                        <button
                          onClick={() => completeOnboarding(req)}
                          className="px-4 py-2 bg-green-600 text-white text-[12px] font-semibold rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  )}
                  {req.status === "pending" && (
                    <div className="px-5 pb-5">
                      <button
                        onClick={async () => {
                          const { error } = await supabase.from("onboarding_requests").update({ status: "approved" }).eq("id", req.id);
                          if (error) setToast({ type: "error", message: "Failed to approve" });
                          else {
                            setRequests((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: "approved" } : r)));
                            setToast({ type: "success", message: "Onboarding approved" });
                          }
                        }}
                        className="px-4 py-2 bg-[#0D7377] text-white text-[12px] font-semibold rounded-lg hover:bg-[#0a5c60] transition-colors"
                      >
                        Approve Onboarding
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <i className="ri-user-add-line text-4xl mb-3 block" />
            <p className="text-[13px]">No {filter !== "all" ? filter : ""} onboarding requests</p>
          </div>
        )}
      </div>

      {/* Start Onboarding Modal */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold text-gray-900">Start Onboarding</h3>
              <button onClick={() => setShowStartModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                <i className="ri-close-line text-lg" />
              </button>
            </div>
            <p className="text-[13px] text-gray-500 mb-4">
              To start onboarding, create a new employee first in the <strong>Employees</strong> module, then return here to begin their onboarding journey.
            </p>
            <button
              onClick={() => setShowStartModal(false)}
              className="w-full px-4 py-2.5 bg-[#0D7377] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showDocModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">
                Add Document — {STAGES.find((s) => s.key === selectedStage)?.label}
              </h3>
              <button onClick={() => setShowDocModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500">
                <i className="ri-close-line text-lg" />
              </button>
            </div>
            <form onSubmit={handleDocUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Document Name *</label>
                <select
                  value={docForm.document_name}
                  onChange={(e) => setDocForm({ ...docForm, document_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377] bg-white"
                  required
                >
                  <option value="">Select document type</option>
                  {DOCUMENT_TEMPLATES[selectedStage]?.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  <option value="custom">Custom...</option>
                </select>
                {docForm.document_name === "custom" && (
                  <input
                    type="text"
                    placeholder="Enter document name"
                    onChange={(e) => setDocForm({ ...docForm, document_name: e.target.value })}
                    className="mt-2 w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377]"
                    required
                  />
                )}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Upload File (optional)</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-6 border-2 border-dashed border-gray-200 rounded-xl text-center cursor-pointer hover:border-[#0D7377]/30 hover:bg-[#0D7377]/5 transition-colors"
                >
                  <i className="ri-upload-cloud-line text-2xl text-gray-400 mb-2 block" />
                  <p className="text-[13px] text-gray-600">Click or drag file to upload</p>
                  <p className="text-[11px] text-gray-400 mt-1">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
                  {fileInputRef.current?.files?.[0] && (
                    <p className="text-[12px] text-[#0D7377] font-medium mt-2">{fileInputRef.current.files[0].name}</p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Notes (optional)</label>
                <textarea
                  value={docForm.notes}
                  onChange={(e) => setDocForm({ ...docForm, notes: e.target.value })}
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377] resize-none"
                  placeholder="Add notes about this document..."
                />
              </div>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 px-4 py-2.5 bg-[#0D7377] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors disabled:opacity-50"
                >
                  {uploading ? "Saving..." : "Add Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}