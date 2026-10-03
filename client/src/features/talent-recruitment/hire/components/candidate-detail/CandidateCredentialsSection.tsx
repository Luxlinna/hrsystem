import { memo, useState, useEffect, useMemo } from "react";
import type { Candidate } from "../../types";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { parseCredentialList, type FormattedCredential } from "./candidateInfoUtils";

interface CandidateCredentialsSectionProps {
  candidate: Candidate;
}

export const CandidateCredentialsSection = memo(function CandidateCredentialsSection({
  candidate,
}: CandidateCredentialsSectionProps) {
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [eduValue, setEduValue] = useState(candidate.education || "");
  const [expValue, setExpValue] = useState(candidate.work_experience || "");
  const [savingCredentials, setSavingCredentials] = useState(false);

  useEffect(() => {
    setEduValue(candidate.education || "");
    setExpValue(candidate.work_experience || "");
  }, [candidate.education, candidate.work_experience]);

  const parsedEducation = useMemo(() => parseCredentialList(candidate.education, "education"), [candidate.education]);
  const parsedExperience = useMemo(() => parseCredentialList(candidate.work_experience, "experience"), [candidate.work_experience]);

  const hasEducation = parsedEducation.length > 0;
  const hasExperience = parsedExperience.length > 0;

  const handleSaveCredentials = async () => {
    setSavingCredentials(true);
    try {
      const { error } = await supabase
        .from("candidates")
        .update({
          education: eduValue.trim() || null,
          work_experience: expValue.trim() || null,
        })
        .eq("id", candidate.id);
      if (error) throw error;
      candidate.education = eduValue.trim() || null;
      candidate.work_experience = expValue.trim() || null;
      setIsEditingCredentials(false);
      toast("Credentials Saved", "Education and experience updated successfully.", "success");
    } catch (err: any) {
      toast("Error", err.message || "Failed to save credentials", "error");
    } finally {
      setSavingCredentials(false);
    }
  };

  const handleAutoClean = () => {
    const cleanEdu = parseCredentialList(eduValue, "education")
      .map((item) => `${item.title}${item.organization ? ` – ${item.organization}` : ""}${item.dateRange ? ` (${item.dateRange})` : ""}`)
      .join("\n");
    const cleanExp = parseCredentialList(expValue, "experience")
      .map((item) => `${item.title}${item.organization ? ` – ${item.organization}` : ""}${item.dateRange ? ` (${item.dateRange})` : ""}`)
      .join("\n");
    if (cleanEdu) setEduValue(cleanEdu);
    if (cleanExp) setExpValue(cleanExp);
    toast("Auto-Formatted", "Cleaned raw text into structured items.", "info");
  };

  return (
    <div className="pt-6 border-t border-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              {hasEducation && !hasExperience
                ? "Academic Qualifications"
                : !hasEducation && hasExperience
                ? "Career & Professional Experience"
                : "Academic Qualifications & Career History"}
            </h3>
            {hasEducation && !hasExperience && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-flex items-center gap-1">
                <i className="ri-user-smile-line" /> Fresh Graduate / Entry Level
              </span>
            )}
          </div>
          <p className="text-[12px] text-slate-500 font-medium mt-0.5">
            {hasEducation && !hasExperience
              ? "Candidate educational background & credentials"
              : !hasEducation && hasExperience
              ? "Verified employment and commercial career history"
              : "Structured background track extracted from candidate resume & CV submissions"}
          </p>
        </div>

        {!isEditingCredentials ? (
          <button
            type="button"
            onClick={() => {
              setEduValue(candidate.education || "");
              setExpValue(candidate.work_experience || "");
              setIsEditingCredentials(true);
            }}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#253C7D] border border-slate-200/80 text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <i className="ri-edit-line text-sm" />
            <span>Edit Credentials</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditingCredentials(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingCredentials}
              onClick={handleSaveCredentials}
              className="px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
            >
              {savingCredentials ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="ri-check-line font-bold" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {isEditingCredentials ? (
        <div className="space-y-4 bg-slate-50/90 p-5 rounded-3xl border border-slate-200 shadow-inner">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Credential Format Editor
              </span>
              <p className="text-[11px] text-slate-500">
                Format per line: <span className="font-mono text-slate-700">Degree or Role – Institution or Company (Year)</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoClean}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
            >
              <i className="ri-magic-line text-indigo-600" />
              <span>Auto-Format Clean Items</span>
            </button>
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
              Education Background
            </label>
            <textarea
              rows={3}
              value={eduValue}
              onChange={(e) => setEduValue(e.target.value)}
              placeholder="Degree / Major – Institution (Year)"
              className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-indigo-100 font-mono leading-relaxed"
            />
          </div>

          <div>
            <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
              Work Experience History (Optional)
            </label>
            <textarea
              rows={3}
              value={expValue}
              onChange={(e) => setExpValue(e.target.value)}
              placeholder="Position – Company (Year)"
              className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-indigo-100 font-mono leading-relaxed"
            />
          </div>
        </div>
      ) : !hasEducation && !hasExperience ? (
        <div className="py-10 text-center bg-slate-50/60 rounded-3xl border border-dashed border-slate-200/90 p-6 space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-lg">
            <i className="ri-profile-line" />
          </div>
          <p className="text-xs font-bold text-slate-700">No background credentials recorded yet</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Upload candidate resume/CV or click &ldquo;Edit Credentials&rdquo; above to record education and work history.
          </p>
        </div>
      ) : (
        <div className={`grid gap-6 ${hasEducation && hasExperience ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {hasEducation && <CredentialColumn title="Education & Degrees" badge="Academic" icon="ri-graduation-cap-line" colorTheme="purple" items={parsedEducation} />}
          {hasExperience && <CredentialColumn title="Work & Career History" badge="Employment" icon="ri-briefcase-line" colorTheme="blue" items={parsedExperience} />}
        </div>
      )}
    </div>
  );
});

interface CredentialColumnProps {
  title: string;
  badge: string;
  icon: string;
  colorTheme: "purple" | "blue";
  items: FormattedCredential[];
}

function CredentialColumn({ title, badge, icon, colorTheme, items }: CredentialColumnProps) {
  const isPurple = colorTheme === "purple";
  const iconBg = isPurple ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700";
  const badgeClass = isPurple ? "bg-purple-50 text-purple-700 border-purple-200/70" : "bg-blue-50 text-blue-700 border-blue-200/70";
  const borderLeft = isPurple ? "border-l-purple-500" : "border-l-blue-500";
  const dateClass = isPurple ? "bg-purple-50 text-purple-700 border-purple-200/70" : "bg-blue-50 text-blue-700 border-blue-200/70";
  const orgIcon = isPurple ? "ri-bank-line text-purple-600" : "ri-building-2-line text-blue-600";
  const bulletDot = isPurple ? "bg-purple-400" : "bg-blue-400";

  return (
    <div className="bg-slate-50/50 rounded-3xl border border-slate-200/70 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-2xs ${iconBg}`}>
            <i className={`${icon} text-base`} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">{title}</h4>
            <span className="text-[10px] font-bold text-slate-400">
              {items.length} {items.length === 1 ? "Record" : "Records"}
            </span>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${badgeClass}`}>
          {badge}
        </span>
      </div>

      <div className="space-y-3.5">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-4 sm:p-4.5 bg-white rounded-2xl border border-slate-200/80 border-l-4 ${borderLeft} shadow-2xs hover:shadow-xs transition-all duration-150 space-y-2.5 overflow-hidden`}
          >
            <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h5 className="text-[13px] sm:text-sm font-extrabold text-slate-900 tracking-tight leading-snug break-words">
                  {item.title}
                </h5>
                {item.organization && (
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 mt-1 break-words">
                    <i className={`${orgIcon} text-xs shrink-0`} />
                    <span className="break-words">{item.organization}</span>
                  </div>
                )}
              </div>
              {item.dateRange && (
                <span className={`self-start sm:self-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${dateClass}`}>
                  <i className="ri-calendar-line text-[10px]" />
                  {item.dateRange}
                </span>
              )}
            </div>
            {item.highlights && item.highlights.length > 0 && (
              <ul className="pt-2.5 border-t border-slate-100 space-y-2">
                {item.highlights.map((bullet, bIdx) => (
                  <li key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed break-words">
                    <span className={`w-1.5 h-1.5 rounded-full ${bulletDot} mt-1.5 shrink-0`} />
                    <span className="flex-1 min-w-0 break-words">{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
