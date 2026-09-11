import { memo, useState, useEffect, useCallback } from "react";
import type { Candidate, Interview, CandidateApproval, CandidateApprovalSignatory } from "../../types";
import {
  fetchCandidateApproval,
  saveCandidateApproval,
  isCandidateApprovalCompleted,
} from "../../services/candidateApprovalService";
import { exportCandidateApprovalPdf } from "../../exports/exportCandidateApprovalPdf";
import { toast } from "@/components/Toast";

interface CandidateApprovalModalProps {
  isOpen: boolean;
  candidate: Candidate;
  interviews?: Interview[];
  currentUserName?: string;
  onClose: () => void;
  onAdvanceStage?: (targetStage: string) => Promise<void> | void;
}

type TabType = "overview" | "evaluation" | "approvals";

export const CandidateApprovalModal = memo(function CandidateApprovalModal({
  isOpen,
  candidate,
  interviews = [],
  currentUserName = "HR Operations",
  onClose,
  onAdvanceStage,
}: CandidateApprovalModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("approvals");
  const [data, setData] = useState<CandidateApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !candidate) return;
    let mounted = true;
    setLoading(true);

    fetchCandidateApproval(candidate.id, candidate, interviews, currentUserName)
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load candidate approval:", err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, candidate, interviews, currentUserName]);

  const handleSave = useCallback(
    async (showToast = true): Promise<CandidateApproval | null> => {
      if (!data) return null;
      setSaving(true);
      try {
        const saved = await saveCandidateApproval(data);
        setData(saved);
        if (showToast) {
          toast("Approval Saved", "Candidate approval details updated successfully.", "success");
        }
        return saved;
      } catch (err: any) {
        toast("Error", err.message || "Failed to save approval details", "error");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [data]
  );

  const handleSignStep = useCallback(
    async (roleKey: keyof CandidateApproval["signatories"]) => {
      if (!data) return;
      const now = new Date().toISOString();
      const currentSig = data.signatories[roleKey];

      const updatedSig: CandidateApprovalSignatory = {
        ...currentSig,
        status: "approved",
        checked_by: currentUserName,
        signed_at: now,
      };

      const nextSignatories = {
        ...data.signatories,
        [roleKey]: updatedSig,
      };

      const updated: CandidateApproval = {
        ...data,
        signatories: nextSignatories,
      };

      setData(updated);
      setSaving(true);
      try {
        const saved = await saveCandidateApproval(updated);
        setData(saved);
        toast("Step Approved", `${currentSig.title} sign-off recorded.`, "success");
      } catch {
        toast("Error", "Failed to record approval sign-off.", "error");
      } finally {
        setSaving(false);
      }
    },
    [data, currentUserName]
  );

  const handleApproveAll = useCallback(async () => {
    if (!data) return;
    const now = new Date().toISOString();
    const sigs = { ...data.signatories };

    (Object.keys(sigs) as Array<keyof typeof sigs>).forEach((k) => {
      sigs[k] = {
        ...sigs[k],
        status: "approved",
        checked_by: sigs[k].checked_by || currentUserName,
        signed_at: sigs[k].signed_at || now,
      };
    });

    const updated: CandidateApproval = {
      ...data,
      signatories: sigs,
      status: "approved",
      completed_at: now,
    };

    setData(updated);
    setSaving(true);
    try {
      const saved = await saveCandidateApproval(updated);
      setData(saved);
      toast(
        "Candidate Approved",
        "All 4 executive approval steps have been signed and approved!",
        "success"
      );
    } catch {
      toast("Error", "Failed to approve all steps.", "error");
    } finally {
      setSaving(false);
    }
  }, [data, currentUserName]);

  const handleExportPdf = useCallback(() => {
    if (!data) return;
    exportCandidateApprovalPdf(data);
  }, [data]);

  const handleAdvanceNext = useCallback(async () => {
    const saved = await handleSave(false);
    if (!saved) return;
    if (onAdvanceStage) {
      await onAdvanceStage("salary_negotiation");
    }
    onClose();
  }, [handleSave, onAdvanceStage, onClose]);

  if (!isOpen) return null;

  const isCompleted = isCandidateApprovalCompleted(data);
  const sigs = data?.signatories;

  const approvedCount = sigs
    ? Object.values(sigs).filter((s) => s.status === "approved").length
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center text-xl shadow-2xs">
              <i className="ri-file-check-line" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">
                  Candidate Approval Form (CAF)
                </h2>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  {data?.form_number || "CAF-2026-..."}
                </span>
                <span
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {isCompleted ? "All 4 Approved" : `${approvedCount}/4 Signed`}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                For candidate <span className="font-bold text-gray-800">{candidate.full_name}</span> &bull; {candidate.job_postings?.title || "Role"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-100 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("approvals")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === "approvals"
                ? "text-fuchsia-700 border-b-2 border-fuchsia-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-user-follow-line mr-1.5" />
            III. Final Approvals ({approvedCount}/4)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === "overview"
                ? "text-fuchsia-700 border-b-2 border-fuchsia-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-user-line mr-1.5" />
            I. Candidate & Role Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("evaluation")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative ${
              activeTab === "evaluation"
                ? "text-fuchsia-700 border-b-2 border-fuchsia-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-file-list-3-line mr-1.5" />
            II. Evaluation Summary & Panels
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/40">
          {loading || !data ? (
            <div className="py-20 text-center text-gray-400 space-y-2">
              <i className="ri-loader-4-line text-3xl animate-spin text-fuchsia-600 inline-block" />
              <p className="text-xs font-bold">Loading Candidate Approval Data...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: 4-STEP FINAL APPROVALS */}
              {activeTab === "approvals" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-extrabold text-gray-900">
                        Section III: Final Approval Signatories
                      </h3>
                      <p className="text-xs text-gray-500">
                        Review comments and collect authorized signatures from all 4 leadership roles.
                      </p>
                    </div>
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={handleApproveAll}
                        className="px-3 py-1.5 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <i className="ri-shield-check-line text-sm" /> Fast-Sign All (Admin)
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. CEO / Division Director */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black text-fuchsia-600 uppercase tracking-wider block">
                            STEP 1 • EXECUTIVE SIGN-OFF
                          </span>
                          <h4 className="text-sm font-extrabold text-gray-900">
                            CEO / Division Director
                          </h4>
                          <p className="text-xs text-gray-500 font-medium">
                            {data.signatories.ceo.assigned_name}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            data.signatories.ceo.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {data.signatories.ceo.status === "approved" ? "Signed" : "Pending"}
                        </span>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">
                          Comment
                        </label>
                        <textarea
                          rows={2}
                          value={data.signatories.ceo.comment || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              signatories: {
                                ...data.signatories,
                                ceo: { ...data.signatories.ceo, comment: e.target.value },
                              },
                            })
                          }
                          placeholder="Endorsed for hire..."
                          className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-gray-50/50"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-gray-400">
                          {data.signatories.ceo.signed_at
                            ? `Signed on ${new Date(data.signatories.ceo.signed_at).toLocaleDateString()}`
                            : "Awaiting sign-off"}
                        </div>
                        {data.signatories.ceo.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleSignStep("ceo")}
                            className="px-3 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Sign as CEO
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 2. HR and Admin Manager */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black text-fuchsia-600 uppercase tracking-wider block">
                            STEP 2 • HR SIGN-OFF
                          </span>
                          <h4 className="text-sm font-extrabold text-gray-900">
                            HR and Admin Manager
                          </h4>
                          <p className="text-xs text-gray-500 font-medium">
                            {data.signatories.hr_manager.assigned_name}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            data.signatories.hr_manager.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {data.signatories.hr_manager.status === "approved" ? "Signed" : "Pending"}
                        </span>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">
                          Comment
                        </label>
                        <textarea
                          rows={2}
                          value={data.signatories.hr_manager.comment || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              signatories: {
                                ...data.signatories,
                                hr_manager: { ...data.signatories.hr_manager, comment: e.target.value },
                              },
                            })
                          }
                          placeholder="Candidate passed internal review..."
                          className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-gray-50/50"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-gray-400">
                          {data.signatories.hr_manager.signed_at
                            ? `Signed on ${new Date(data.signatories.hr_manager.signed_at).toLocaleDateString()}`
                            : "Awaiting sign-off"}
                        </div>
                        {data.signatories.hr_manager.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleSignStep("hr_manager")}
                            className="px-3 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Sign as HR Manager
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 3. HR&Admin Division Director */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black text-fuchsia-600 uppercase tracking-wider block">
                            STEP 3 • DIVISION DIRECTOR
                          </span>
                          <h4 className="text-sm font-extrabold text-gray-900">
                            HR&Admin Division Director
                          </h4>
                          <p className="text-xs text-gray-500 font-medium">
                            {data.signatories.division_director.assigned_name}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            data.signatories.division_director.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {data.signatories.division_director.status === "approved" ? "Signed" : "Pending"}
                        </span>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">
                          Comment
                        </label>
                        <textarea
                          rows={2}
                          value={data.signatories.division_director.comment || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              signatories: {
                                ...data.signatories,
                                division_director: { ...data.signatories.division_director, comment: e.target.value },
                              },
                            })
                          }
                          placeholder="Budget allocation approved..."
                          className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-gray-50/50"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-gray-400">
                          {data.signatories.division_director.signed_at
                            ? `Signed on ${new Date(data.signatories.division_director.signed_at).toLocaleDateString()}`
                            : "Awaiting sign-off"}
                        </div>
                        {data.signatories.division_director.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleSignStep("division_director")}
                            className="px-3 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Sign as Division Director
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 4. Chairwoman */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-black text-fuchsia-600 uppercase tracking-wider block">
                            STEP 4 • FINAL CHAIRWOMAN
                          </span>
                          <h4 className="text-sm font-extrabold text-gray-900">
                            Chairwoman
                          </h4>
                          <p className="text-xs text-gray-500 font-medium">
                            {data.signatories.chairwoman.assigned_name}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            data.signatories.chairwoman.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {data.signatories.chairwoman.status === "approved" ? "Signed" : "Pending"}
                        </span>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 block mb-1">
                          Comment
                        </label>
                        <textarea
                          rows={2}
                          value={data.signatories.chairwoman.comment || ""}
                          onChange={(e) =>
                            setData({
                              ...data,
                              signatories: {
                                ...data.signatories,
                                chairwoman: { ...data.signatories.chairwoman, comment: e.target.value },
                              },
                            })
                          }
                          placeholder="Final executive authorization granted..."
                          className="w-full text-xs p-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-gray-50/50"
                        />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div className="text-[10px] text-gray-400">
                          {data.signatories.chairwoman.signed_at
                            ? `Signed on ${new Date(data.signatories.chairwoman.signed_at).toLocaleDateString()}`
                            : "Awaiting sign-off"}
                        </div>
                        {data.signatories.chairwoman.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleSignStep("chairwoman")}
                            className="px-3 py-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                          >
                            Sign as Chairwoman
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Section I: Candidate & Role Overview
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Candidate Name
                      </label>
                      <input
                        type="text"
                        value={data.candidate_name}
                        onChange={(e) => setData({ ...data, candidate_name: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Gender
                      </label>
                      <select
                        value={data.gender}
                        onChange={(e) => setData({ ...data, gender: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Position Applied for
                      </label>
                      <input
                        type="text"
                        value={data.position_applied}
                        onChange={(e) => setData({ ...data, position_applied: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Business Unit
                      </label>
                      <input
                        type="text"
                        value={data.business_unit}
                        onChange={(e) => setData({ ...data, business_unit: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={data.department}
                        onChange={(e) => setData({ ...data, department: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Hiring Manager
                      </label>
                      <input
                        type="text"
                        value={data.hiring_manager}
                        onChange={(e) => setData({ ...data, hiring_manager: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Current Salary
                      </label>
                      <input
                        type="text"
                        value={data.current_salary}
                        onChange={(e) => setData({ ...data, current_salary: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Expectation Salary
                      </label>
                      <input
                        type="text"
                        value={data.expectation_salary}
                        onChange={(e) => setData({ ...data, expectation_salary: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-sky-50 font-black text-sky-800"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Current Benefit
                      </label>
                      <input
                        type="text"
                        value={data.current_benefit}
                        onChange={(e) => setData({ ...data, current_benefit: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Notice Period
                      </label>
                      <input
                        type="text"
                        value={data.notice_period}
                        onChange={(e) => setData({ ...data, notice_period: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: EVALUATION SUMMARY & PANELS */}
              {activeTab === "evaluation" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Section II: Candidate Evaluation Summary
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Education and Skill
                      </label>
                      <textarea
                        rows={3}
                        value={data.education_and_skill}
                        onChange={(e) => setData({ ...data, education_and_skill: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Work Experience
                      </label>
                      <textarea
                        rows={3}
                        value={data.work_experience}
                        onChange={(e) => setData({ ...data, work_experience: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Strengths
                      </label>
                      <textarea
                        rows={3}
                        value={data.strengths}
                        onChange={(e) => setData({ ...data, strengths: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 block mb-1">
                        Improvement
                      </label>
                      <textarea
                        rows={3}
                        value={data.improvement}
                        onChange={(e) => setData({ ...data, improvement: e.target.value })}
                        className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 block mb-1">
                      Overall Assessment
                    </label>
                    <textarea
                      rows={3}
                      value={data.overall_assessment}
                      onChange={(e) => setData({ ...data, overall_assessment: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 bg-white"
                    />
                  </div>

                  {/* Interview Panels Table */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-gray-700">
                        Interview Panels
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setData({
                            ...data,
                            interview_panels: [
                              ...(data.interview_panels || []),
                              {
                                name: "Interviewer Name",
                                date_time: new Date().toLocaleDateString() + " 3:00PM",
                                position: "Panel Member",
                                signature: "Verified",
                              },
                            ],
                          })
                        }
                        className="text-[10px] text-fuchsia-600 hover:text-fuchsia-700 font-bold flex items-center gap-1"
                      >
                        <i className="ri-add-line" /> Add Panel
                      </button>
                    </div>

                    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 text-[10px] font-bold uppercase">
                          <tr>
                            <th className="p-2.5">Interview Panel</th>
                            <th className="p-2.5">Date Time</th>
                            <th className="p-2.5">Position</th>
                            <th className="p-2.5">Signature</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(data.interview_panels || []).map((panel, idx) => (
                            <tr key={idx}>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={panel.name}
                                  onChange={(e) => {
                                    const next = [...data.interview_panels];
                                    next[idx].name = e.target.value;
                                    setData({ ...data, interview_panels: next });
                                  }}
                                  className="w-full p-1 rounded-lg border border-gray-200 text-xs font-semibold"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={panel.date_time}
                                  onChange={(e) => {
                                    const next = [...data.interview_panels];
                                    next[idx].date_time = e.target.value;
                                    setData({ ...data, interview_panels: next });
                                  }}
                                  className="w-full p-1 rounded-lg border border-gray-200 text-xs"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  value={panel.position}
                                  onChange={(e) => {
                                    const next = [...data.interview_panels];
                                    next[idx].position = e.target.value;
                                    setData({ ...data, interview_panels: next });
                                  }}
                                  className="w-full p-1 rounded-lg border border-gray-200 text-xs"
                                />
                              </td>
                              <td className="p-2 text-center text-blue-900 italic font-medium">
                                {panel.signature || "Verified"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 px-6 border-t border-gray-100 bg-white flex items-center justify-between">
          <button
            type="button"
            disabled={saving || !data}
            onClick={() => handleSave(true)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-save-line" /> {saving ? "Saving..." : "Save Draft"}
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!data}
              onClick={handleExportPdf}
              className="px-4 py-2 bg-white hover:bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <i className="ri-file-pdf-line text-sm text-fuchsia-600" />
              Generate Approval Form (PDF)
            </button>

            {isCompleted ? (
              <button
                type="button"
                onClick={handleAdvanceNext}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <i className="ri-check-double-line text-base" />
                Approve & Advance to Salary Negotiation
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-[#172B4D] hover:bg-[#091E42] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close & Complete Later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
