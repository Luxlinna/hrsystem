import { memo, useState, useRef, useEffect, useCallback } from "react";
import type { ComplaintFormState, ComplaintSuggestion, ComplaintType, ComplaintStatus } from "../types";
import {
  COMPLAINT_TYPE_CONFIG,
  COMPLAINT_TYPE_ORDER,
  COMPLAINT_STATUS_CONFIG,
  COMPLAINT_STATUS_ORDER,
  COMMON_TARGET_RECIPIENTS,
} from "../constants";

interface ComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing: ComplaintSuggestion | null;
  form: ComplaintFormState;
  setForm: React.Dispatch<React.SetStateAction<ComplaintFormState>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onUploadDocument: (file: File) => Promise<{ url: string; name: string } | null>;
  branchName: string | null;
}

export const ComplaintModal = memo(function ComplaintModal({
  isOpen,
  onClose,
  editing,
  form,
  setForm,
  saving,
  onSubmit,
  onUploadDocument,
  branchName,
}: ComplaintModalProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const res = await onUploadDocument(file);
      if (res) {
        setForm((f) => ({ ...f, attachment_url: res.url, attachment_name: res.name }));
      }
      setUploading(false);
      e.target.value = "";
    },
    [onUploadDocument, setForm]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Gradient Header ── */}
        <div
          className="px-8 pt-6 pb-5 rounded-t-3xl relative overflow-hidden flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#7C3AED 0%,#6D28D9 60%,#5B21B6 100%)" }}
        >
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle,white,transparent)", transform: "translate(30%,-30%)" }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.18)" }}
              >
                <i className="ri-feedback-line text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {editing ? "Edit Record" : "New Complaint / Suggestion"}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {editing
                    ? "Update complaint or suggestion details"
                    : branchName
                    ? `Logging for ${branchName}`
                    : "Fill in the feedback and suggestion details"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Form Body ── */}
        <form onSubmit={onSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="overflow-y-auto flex-1 px-8 py-6 space-y-4">

            {/* Dynamic BU Scoping Banner */}
            {branchName && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-purple-50/70 border border-purple-100 text-[#6D28D9]">
                <div className="flex items-center gap-2 min-w-0">
                  <i className="ri-building-line text-sm flex-shrink-0" />
                  <span className="text-xs font-extrabold truncate">Business Unit: {branchName}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100/80 text-[#6D28D9] flex-shrink-0">
                  Active BU
                </span>
              </div>
            )}

            {/* Category Type Pills */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                Category Type <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                {COMPLAINT_TYPE_ORDER.map((t) => {
                  const cfg = COMPLAINT_TYPE_CONFIG[t];
                  const isSelected = form.type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-1.5 ${
                        isSelected
                          ? "bg-[#7C3AED] text-white border-[#7C3AED] shadow-sm"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <i className={cfg.icon} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date + Complaint/Suggestion To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.entry_date}
                  onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#7C3AED] transition-all cursor-pointer"
                />
              </div>

              {/* Complaint/Suggestion To */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Complaint / Suggestion To <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="recipient-suggestions"
                    placeholder="e.g. HR Department, Operations, Manager"
                    value={form.target_to}
                    onChange={(e) => setForm((f) => ({ ...f, target_to: e.target.value }))}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#7C3AED] transition-all"
                  />
                  <datalist id="recipient-suggestions">
                    {COMMON_TARGET_RECIPIENTS.map((rec) => (
                      <option key={rec} value={rec} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                Complaint / Suggestion Subject <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Brief summary title or headline…"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#7C3AED] transition-all"
              />
            </div>

            {/* Complaint / Subject Detail */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                Complaint / Subject Detail <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Provide detailed description of the incident, situation, or issue…"
                value={form.details}
                onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-2xl text-xs text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#7C3AED] transition-all resize-none"
              />
            </div>

            {/* Suggestion */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                Suggestion (Proposed Solution)
              </label>
              <textarea
                rows={2}
                placeholder="Recommended solution or constructive ideas to resolve or improve this…"
                value={form.suggestion}
                onChange={(e) => setForm((f) => ({ ...f, suggestion: e.target.value }))}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-2xl text-xs text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#7C3AED] transition-all resize-none"
              />
            </div>

            {/* Remark + Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Remark */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Remark (HR Review &amp; Notes)
                </label>
                <textarea
                  rows={2}
                  placeholder="Administrative notes, follow-up status, or action items…"
                  value={form.remark}
                  onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-2xl text-xs text-gray-800 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#7C3AED] transition-all resize-none"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ComplaintStatus }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#7C3AED] cursor-pointer"
                >
                  {COMPLAINT_STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {COMPLAINT_STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Supporting Document Upload (AWS S3) */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                Supporting File / Attachment (AWS S3)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />

              {form.attachment_url ? (
                <div className="flex items-center justify-between p-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0">
                      <i className="ri-attachment-line text-base" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">
                        {form.attachment_name || "Attached File"}
                      </p>
                      <a
                        href={form.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-purple-600 hover:underline"
                      >
                        View file on AWS S3
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, attachment_url: "", attachment_name: "" }))}
                    className="text-gray-400 hover:text-red-500 cursor-pointer p-1"
                  >
                    <i className="ri-close-line text-base" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center cursor-pointer hover:border-[#7C3AED]/50 hover:bg-gray-50 transition-all group"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-gray-500 font-semibold">Uploading to AWS S3…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#7C3AED]/10 group-hover:text-[#7C3AED] transition-colors">
                        <i className="ri-upload-2-line text-base" />
                      </div>
                      <p className="text-xs font-semibold text-gray-700">Click to upload supporting file or proof</p>
                      <p className="text-[10px] text-gray-400">PDF, DOC, PNG up to 10MB (Stored on AWS S3)</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ── Modal Footer ── */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex items-center justify-between flex-shrink-0">
            <p className="text-[11px] text-gray-400">
              Record will be saved to your active Business Unit
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploading}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
                style={{ background: "linear-gradient(135deg,#7C3AED,#6D28D9)" }}
              >
                {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <i className="ri-check-line text-sm" />
                {editing ? "Save Changes" : "Save Record"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});
