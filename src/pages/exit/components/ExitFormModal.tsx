import { memo, useState, useRef, useEffect, useCallback } from "react";
import type { EmployeeExit, ExitFormState, ExitEmployee } from "../types";
import { EXIT_TYPE_CONFIG, EXIT_TYPE_ORDER, REASON_TYPE_CONFIG, REASON_TYPE_ORDER } from "../constants";
import { useExitEmployeeSearch } from "../hooks/useExitEmployeeSearch";

interface ExitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing: EmployeeExit | null;
  form: ExitFormState;
  setForm: React.Dispatch<React.SetStateAction<ExitFormState>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onUploadDocument: (file: File) => Promise<{ url: string; name: string } | null>;
  branchId: string | null;
  branchName: string | null;
}

function initials(f?: string | null, l?: string | null) {
  return `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();
}

export const ExitFormModal = memo(function ExitFormModal({
  isOpen,
  onClose,
  editing,
  form,
  setForm,
  saving,
  onSubmit,
  onUploadDocument,
  branchId,
  branchName,
}: ExitFormModalProps) {
  const [empQuery, setEmpQuery] = useState("");
  const [selectedEmp, setSelectedEmp] = useState<ExitEmployee | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [uploading, setUploading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { results, searching, search, clear } = useExitEmployeeSearch(branchId);

  // Preload employees from the user's BU when modal opens
  useEffect(() => {
    if (isOpen && !editing) {
      search("", branchId);
    }
  }, [isOpen, branchId, editing, search]);

  // Populate form if editing
  useEffect(() => {
    if (editing) {
      setEmpQuery(
        `${editing.employees?.first_name ?? ""} ${editing.employees?.last_name ?? ""}`.trim()
      );
      setSelectedEmp(null);
    } else {
      setEmpQuery("");
      setSelectedEmp(null);
    }
  }, [editing, isOpen]);

  // Debounced search when typing within the BU
  useEffect(() => {
    if (editing) return;
    const t = setTimeout(() => {
      search(empQuery, branchId);
    }, 250);
    return () => clearTimeout(t);
  }, [empQuery, branchId, editing, search]);

  // Close suggestions on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const selectEmployee = useCallback(
    (emp: ExitEmployee) => {
      setSelectedEmp(emp);
      setEmpQuery(`${emp.first_name} ${emp.last_name}`);
      setForm((f) => ({ ...f, employee_id: emp.id }));
      setShowSuggestions(false);
      clear();
    },
    [setForm, clear]
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      const result = await onUploadDocument(file);
      if (result) {
        setForm((f) => ({ ...f, document_url: result.url, document_name: result.name }));
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
          style={{ background: "linear-gradient(135deg,#1a2e5e 0%,#253C7D 60%,#3554a5 100%)" }}
        >
          <div
            className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle,white,transparent)", transform: "translate(30%,-30%)" }}
          />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <i className="ri-logout-box-r-line text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {editing ? "Edit Exit Record" : "Record Employee Exit"}
                </h3>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {editing
                    ? "Update departure details"
                    : branchName
                    ? `Recording exit for ${branchName}`
                    : "Fill in the departure information"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* ── Scrollable Form ── */}
        <form onSubmit={onSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="overflow-y-auto flex-1 px-8 py-6 space-y-5">

            {/* Dynamic BU Scope Banner */}
            {branchName && (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-blue-50/70 border border-blue-100 text-[#253C7D]">
                <div className="flex items-center gap-2 min-w-0">
                  <i className="ri-building-line text-sm flex-shrink-0" />
                  <span className="text-xs font-extrabold truncate">Business Unit: {branchName}</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100/70 text-[#253C7D] flex-shrink-0">
                  Own BU Only
                </span>
              </div>
            )}

            {/* Employee Picker */}
            {!editing && (
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                  Employee <span className="text-rose-500">*</span>
                </label>
                <div className="relative" ref={searchRef}>
                  <div className="relative">
                    <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
                    <input
                      type="text"
                      value={empQuery}
                      onFocus={() => {
                        setShowSuggestions(true);
                        if (results.length === 0) search(empQuery, branchId);
                      }}
                      onChange={(e) => {
                        setEmpQuery(e.target.value);
                        setSelectedEmp(null);
                        setForm((f) => ({ ...f, employee_id: "" }));
                        setShowSuggestions(true);
                      }}
                      placeholder={
                        branchName
                          ? `Search or select active employee in ${branchName}…`
                          : "Search active employee by name or ID…"
                      }
                      className="w-full pl-9 pr-8 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#253C7D] bg-gray-50 focus:bg-white transition-all"
                      autoComplete="off"
                    />
                    {searching ? (
                      <i className="ri-loader-4-line animate-spin absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    ) : empQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setEmpQuery("");
                          setSelectedEmp(null);
                          setForm((f) => ({ ...f, employee_id: "" }));
                          search("", branchId);
                          setShowSuggestions(true);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <i className="ri-close-line text-sm" />
                      </button>
                    ) : null}
                  </div>

                  {/* Dropdown Suggestions */}
                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                      {results.length > 0 ? (
                        results.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => selectEmployee(emp)}
                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                          >
                            {emp.avatar_url ? (
                              <img
                                src={emp.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-xl object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 flex items-center justify-center text-[11px] font-bold text-[#253C7D] flex-shrink-0">
                                {initials(emp.first_name, emp.last_name)}
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-gray-900 truncate">
                                {emp.first_name} {emp.last_name}
                              </p>
                              {(emp.role || emp.department) && (
                                <p className="text-[11px] text-gray-400 truncate">
                                  {[emp.role, emp.department].filter(Boolean).join(" · ")}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-xs text-gray-400">
                          {searching
                            ? "Fetching active employees..."
                            : "No active employees found in your Business Unit."}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Confirmation Card */}
                {selectedEmp && (
                  <div className="mt-2.5 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#253C7D]/5 border border-[#253C7D]/15 animate-in fade-in duration-150">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedEmp.avatar_url ? (
                        <img
                          src={selectedEmp.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {initials(selectedEmp.first_name, selectedEmp.last_name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-gray-900 truncate">
                          {selectedEmp.first_name} {selectedEmp.last_name}
                        </p>
                        {(selectedEmp.role || selectedEmp.department) && (
                          <p className="text-[11px] text-gray-500 truncate">
                            {[selectedEmp.role, selectedEmp.department].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEmp(null);
                        setEmpQuery("");
                        setForm((f) => ({ ...f, employee_id: "" }));
                        search("", branchId);
                        setShowSuggestions(true);
                      }}
                      className="text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition-colors flex-shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Exit Type + Last Working Day */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Exit Type <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    required
                    value={form.exit_type}
                    onChange={(e) => setForm((f) => ({ ...f, exit_type: e.target.value as any }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer appearance-none transition-all"
                  >
                    {EXIT_TYPE_ORDER.map((t) => (
                      <option key={t} value={t}>{EXIT_TYPE_CONFIG[t].label}</option>
                    ))}
                  </select>
                  <i className="ri-arrow-down-s-line absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  Last Working Day <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={form.last_working_day}
                  onChange={(e) => setForm((f) => ({ ...f, last_working_day: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 bg-gray-50 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer transition-all"
                />
              </div>
            </div>

            {/* Reason Type Pills */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Reason Type <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {REASON_TYPE_ORDER.map((rt) => {
                  const isSelected = form.reason_type === rt;
                  return (
                    <button
                      key={rt}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, reason_type: rt }))}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                          : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {REASON_TYPE_CONFIG[rt].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason Description */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Reason Description
              </label>
              <textarea
                rows={3}
                value={form.reason_description}
                onChange={(e) => setForm((f) => ({ ...f, reason_description: e.target.value }))}
                placeholder="Provide additional context about the exit..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:border-[#253C7D] bg-gray-50 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Supporting Document Upload (AWS S3) */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Supporting Document
              </label>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />

              {form.document_url ? (
                <div className="flex items-center justify-between p-3.5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                      <i className="ri-file-text-line text-base" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{form.document_name || "Document"}</p>
                      <a
                        href={form.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-600 hover:underline"
                      >
                        View file
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, document_url: "", document_name: "" }))}
                    className="text-gray-400 hover:text-red-500 cursor-pointer p-1"
                  >
                    <i className="ri-close-line text-base" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center cursor-pointer hover:border-[#253C7D]/50 hover:bg-gray-50 transition-all group"
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs text-gray-500 font-semibold">Uploading to AWS S3…</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#253C7D]/10 group-hover:text-[#253C7D] transition-colors">
                        <i className="ri-upload-2-line text-lg" />
                      </div>
                      <p className="text-xs font-semibold text-gray-700">Click to upload resignation/termination letter</p>
                      <p className="text-[11px] text-gray-400">PDF, DOC, PNG up to 10MB (Stored on AWS S3)</p>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* ── Sticky Footer ── */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 rounded-b-3xl flex items-center justify-between flex-shrink-0">
            <p className="text-[11px] text-gray-400">
              Employee status will be set to <span className="font-semibold text-rose-500">Inactive</span> on save
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
                style={{ background: "linear-gradient(135deg,#253C7D,#3554a5)" }}
              >
                {saving && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <i className="ri-check-line text-sm" />
                {editing ? "Save Changes" : "Record Exit"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});
