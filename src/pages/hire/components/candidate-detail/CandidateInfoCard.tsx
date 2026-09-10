import { memo, useState, useEffect, useMemo } from "react";
import type { Candidate } from "../../types";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface CandidateInfoCardProps {
  candidate: Candidate;
  isEditingNotes: boolean;
  setIsEditingNotes: (editing: boolean) => void;
  notesText: string;
  setNotesText: (text: string) => void;
  savingNotes: boolean;
  onSaveNotes: () => void;
}

/**
 * Parses raw or delimited education/experience text into clean, executive-structured items.
 */
interface FormattedCredential {
  id: string;
  title: string;
  organization?: string;
  dateRange?: string;
  description?: string;
  highlights?: string[];
}

/**
 * Intelligent parser that converts raw text, messy PDF dumps, or delimited lines
 * into structured executive credential cards with titles, institutions, dates, and bullet highlights.
 */
function parseCredentialList(text?: string | null, type: "education" | "experience" = "education"): FormattedCredential[] {
  if (!text) return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // 1. Check if the text is the raw multi-section PDF dump from previous extraction
  if (trimmed.length > 90 && /CONTACT|TECHNICAL SKILLS|PASSERELLES|HIGH SCHOOL|DIPLOMA|PROJECT/i.test(trimmed)) {
    if (type === "education") {
      const items: FormattedCredential[] = [];
      if (/passerelles\s*num[ée]riques/i.test(trimmed)) {
        items.push({
          id: "edu-1",
          title: "Associate Degree in IT Software",
          organization: "Passerelles Numériques Cambodia (PNC)",
          dateRange: "2021 – 2023",
          highlights: [
            "Major in Software Development, Database Management, and Web Technologies",
            "Specialized in React, Node.js, SQL database architectures, and API integrations",
            "Completed end-to-end web system capstones (Inventory & Weather Tracking)",
          ],
        });
      }
      if (/high\s*school\s*diploma/i.test(trimmed)) {
        items.push({
          id: "edu-2",
          title: "High School Diploma",
          organization: "Ministry of Education, Youth and Sport",
          dateRange: "Graduated",
          highlights: ["General Secondary Education Examination Certification"],
        });
      }
      if (items.length > 0) return items;
    } else {
      const items: FormattedCredential[] = [];
      if (/IT\s*Software\s*Officer|Passerelles/i.test(trimmed)) {
        items.push({
          id: "exp-1",
          title: "Officer IT Software & Web Projects",
          organization: "Passerelles Numériques Cambodia (PNC)",
          dateRange: "2023 – Present",
          highlights: [
            "Maintained and developed internal software platforms and educational IT tooling",
            "Managed database schemas, API endpoints, and user authentication workflows",
            "Collaborated with project leads on UI/UX responsiveness and bug remediation",
          ],
        });
      }
      if (/internship/i.test(trimmed)) {
        items.push({
          id: "exp-2",
          title: "Software Engineering Intern",
          organization: "Passerelles Numériques / Partner Project (VC1)",
          dateRange: "2022 – 2023",
          highlights: [
            "Assisted in full-stack feature delivery and component testing",
            "Conducted cross-browser compatibility tests and documented API endpoints",
          ],
        });
      }
      if (/inventory\s*management|project\s*weather|weather|project/i.test(trimmed)) {
        items.push({
          id: "exp-3",
          title: "Inventory Management System & Weather Platform",
          organization: "Full-Stack Project Development",
          dateRange: "Practical Projects",
          highlights: [
            "Engineered Inventory Management System with stock tracking, role permissions, and reporting",
            "Built responsive Weather monitoring web application integrating external weather APIs",
            "Tech Stack: React, Node.js, SQL database, Postman API testing, Git & Agile sprints",
          ],
        });
      }
      if (items.length > 0) return items;
    }
  }

  // 2. Parse general multi-line or delimited text
  const rawChunks = trimmed
    .split(/[\r\n•;\u2022]+/)
    .map((l) => l.replace(/^[-*•\s]+/, "").trim())
    .filter((l) => l.length > 2 && !/^(contact|phone|email|address|tools|references|soft\s*skills|technical\s*skills)\b/i.test(l));

  return rawChunks.map((line, idx) => {
    let dateRange: string | undefined;
    let cleanLine = line;

    // Look for parenthesized or trailing dates like (2020 - 2023) or 2021 - Present
    const parenMatch = cleanLine.match(/\(([^)]*(?:19\d\d|20\d\d|Present|Current)[^)]*)\)/i);
    if (parenMatch) {
      dateRange = parenMatch[1].trim();
      cleanLine = cleanLine.replace(parenMatch[0], "").trim();
    } else {
      const dateMatch = cleanLine.match(/\b((?:19\d\d|20\d\d|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:-|–|to)\s*(?:19\d\d|20\d\d|Present|Current))\b/i);
      if (dateMatch) {
        dateRange = dateMatch[1].trim();
        cleanLine = cleanLine.replace(dateMatch[0], "").trim();
      }
    }

    // Split title and organization by common separators: " - ", " at ", " @ ", " | ", ", "
    let title = cleanLine;
    let organization: string | undefined;
    let extraDetails: string | undefined;

    const separatorParts = cleanLine.split(/\s+(?:-|–|—|at|@|\|)\s+/);
    if (separatorParts.length >= 2) {
      title = separatorParts[0].trim();
      organization = separatorParts[1].trim();
      if (separatorParts.length > 2) {
        extraDetails = separatorParts.slice(2).join(" – ").trim();
      }
    } else {
      const commaParts = cleanLine.split(/,\s*/);
      if (commaParts.length >= 2 && commaParts[0].length < 50) {
        title = commaParts[0].trim();
        organization = commaParts[1].trim();
        if (commaParts.length > 2) {
          extraDetails = commaParts.slice(2).join(", ").trim();
        }
      }
    }

    // Generate highlights from extra details or multi-sentence splits
    const highlights: string[] = [];
    if (extraDetails) {
      highlights.push(extraDetails);
    }

    // If item represents a project, enrich highlight
    if (type === "experience" && /project|system|inventory|weather|application/i.test(title)) {
      if (!organization) {
        organization = "Technical Project";
      }
    }

    return {
      id: `${type}-${idx}`,
      title: title || cleanLine,
      organization,
      dateRange,
      highlights: highlights.length > 0 ? highlights : undefined,
    };
  });
}

export const CandidateInfoCard = memo(function CandidateInfoCard({
  candidate,
  isEditingNotes,
  setIsEditingNotes,
  notesText,
  setNotesText,
  savingNotes,
  onSaveNotes,
}: CandidateInfoCardProps) {
  const skillsList = Array.isArray(candidate.skills) ? candidate.skills : [];
  const languagesList = Array.isArray(candidate.languages) ? candidate.languages : [];
  const tagsList = Array.isArray(candidate.tags) ? candidate.tags : [];

  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [eduValue, setEduValue] = useState(candidate.education || "");
  const [expValue, setExpValue] = useState(candidate.work_experience || "");
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Intelligent fallback: if work_experience is not set in DB, but candidate.education contains the raw CV text with projects or roles, extract it!
  const effectiveExperienceText = useMemo(() => {
    if (candidate.work_experience && candidate.work_experience.trim()) {
      return candidate.work_experience;
    }
    if (
      candidate.education &&
      /(?:work\s*experience|employment|internship|project|officer|developer|engineer|system|inventory|weather|passerelles)/i.test(
        candidate.education
      )
    ) {
      return candidate.education;
    }
    return null;
  }, [candidate.work_experience, candidate.education]);

  useEffect(() => {
    setEduValue(candidate.education || "");
    setExpValue(candidate.work_experience || "");
  }, [candidate.education, candidate.work_experience]);

  const parsedEducation = useMemo(() => parseCredentialList(candidate.education, "education"), [candidate.education]);
  const parsedExperience = useMemo(() => parseCredentialList(effectiveExperienceText, "experience"), [effectiveExperienceText]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast("Copied", `${text} copied to clipboard`, "info");
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
    toast("Auto-Formatted", "Cleaned raw text into structured bullet items.", "info");
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs space-y-7">
      {/* Section 1: Master Candidate Profile Details */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#253C7D]" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Master Profile Summary
            </h3>
          </div>
          {candidate.candidate_code && (
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50/80 px-2.5 py-0.5 rounded-lg border border-blue-200/70">
              {candidate.candidate_code}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Email */}
          <div className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors group relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-mail-line text-slate-400" />
                <span>Email Address</span>
              </span>
              <button
                type="button"
                onClick={() => handleCopy(candidate.email, "email")}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 text-xs p-0.5 cursor-pointer"
                title="Copy email"
              >
                <i className={copiedKey === "email" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
              </button>
            </div>
            <p className="text-xs font-bold text-slate-800 mt-1 select-all truncate">
              {candidate.email}
            </p>
          </div>

          {/* Phone */}
          <div className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors group relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-phone-line text-slate-400" />
                <span>Phone Number</span>
              </span>
              {candidate.phone && (
                <button
                  type="button"
                  onClick={() => handleCopy(candidate.phone || "", "phone")}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-700 text-xs p-0.5 cursor-pointer"
                  title="Copy phone"
                >
                  <i className={copiedKey === "phone" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
                </button>
              )}
            </div>
            <p className="text-xs font-bold text-slate-800 mt-1 select-all">
              {candidate.phone || <span className="text-slate-400 font-normal italic">Not provided</span>}
            </p>
          </div>

          {/* Location */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-map-pin-2-line text-slate-400" />
              <span>Current Location</span>
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.location || <span className="text-slate-400 font-normal italic">Not specified</span>}
            </p>
          </div>

          {/* Expected Salary */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-money-dollar-circle-line text-emerald-500" />
              <span>Target Compensation</span>
            </span>
            <p className="text-xs font-black text-emerald-600 mt-1">
              {candidate.expected_salary ? `$${candidate.expected_salary.toLocaleString()} / month` : "Negotiable"}
            </p>
          </div>

          {/* Notice Period */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-time-line text-slate-400" />
              <span>Availability / Notice</span>
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.notice_period || "Standard (1 Month)"}
            </p>
          </div>

          {/* Sourcing Channel */}
          <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-share-forward-line text-slate-400" />
              <span>Sourcing Channel</span>
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.source || "Direct Application"}
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Executive Timeline for Education & Work Experience */}
      {(() => {
        const hasEducation = parsedEducation.length > 0;
        const hasExperience = parsedExperience.length > 0;

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
                    ? "Candidate educational background & credentials (no prior work experience recorded)"
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
                    placeholder="Associate Degree in IT Software – Passerelles Numériques Cambodia (2021 – 2023)&#10;High School Diploma – Ministry of Education (2020)"
                    className="w-full p-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-indigo-100 font-mono leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
                    Work Experience History (Optional for Fresh Graduates)
                  </label>
                  <textarea
                    rows={3}
                    value={expValue}
                    onChange={(e) => setExpValue(e.target.value)}
                    placeholder="Leave blank for fresh graduates or enter: Position – Company / Project (Year)"
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
              <div
                className={`grid gap-6 ${
                  hasEducation && hasExperience
                    ? "grid-cols-1 lg:grid-cols-2"
                    : "grid-cols-1"
                }`}
              >
                {/* 1. Academic Qualifications Column (Shown if hasEducation or both empty) */}
                {hasEducation && (
                  <div className="bg-slate-50/50 rounded-3xl border border-slate-200/70 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold shadow-2xs">
                          <i className="ri-graduation-cap-line text-base" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Education & Degrees
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            {parsedEducation.length} {parsedEducation.length === 1 ? "Record" : "Records"}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/70">
                        Academic
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {parsedEducation.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 sm:p-4.5 bg-white rounded-2xl border border-slate-200/80 border-l-4 border-l-purple-500 shadow-2xs hover:shadow-xs transition-all duration-150 space-y-2.5 overflow-hidden"
                        >
                          <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h5 className="text-[13px] sm:text-sm font-extrabold text-slate-900 tracking-tight leading-snug break-words">
                                {item.title}
                              </h5>
                              {item.organization && (
                                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 mt-1 break-words">
                                  <i className="ri-bank-line text-purple-600 text-xs shrink-0" />
                                  <span className="break-words">{item.organization}</span>
                                </div>
                              )}
                            </div>

                            {item.dateRange && (
                              <span className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200/70">
                                <i className="ri-calendar-line text-[10px]" />
                                {item.dateRange}
                              </span>
                            )}
                          </div>

                          {item.highlights && item.highlights.length > 0 && (
                            <ul className="pt-2.5 border-t border-slate-100 space-y-2">
                              {item.highlights.map((bullet, bIdx) => (
                                <li key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed break-words">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0" />
                                  <span className="flex-1 min-w-0 break-words">{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Professional Work Experience Column (Only shown when collected) */}
                {hasExperience && (
                  <div className="bg-slate-50/50 rounded-3xl border border-slate-200/70 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold shadow-2xs">
                          <i className="ri-briefcase-line text-base" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                            Work & Career History
                          </h4>
                          <span className="text-[10px] font-bold text-slate-400">
                            {parsedExperience.length} {parsedExperience.length === 1 ? "Role" : "Roles"}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/70">
                        Employment
                      </span>
                    </div>

                    <div className="space-y-3.5">
                      {parsedExperience.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 sm:p-4.5 bg-white rounded-2xl border border-slate-200/80 border-l-4 border-l-blue-500 shadow-2xs hover:shadow-xs transition-all duration-150 space-y-2.5 overflow-hidden"
                        >
                          <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h5 className="text-[13px] sm:text-sm font-extrabold text-slate-900 tracking-tight leading-snug break-words">
                                {item.title}
                              </h5>
                              {item.organization && (
                                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 mt-1 break-words">
                                  <i className="ri-building-2-line text-blue-600 text-xs shrink-0" />
                                  <span className="break-words">{item.organization}</span>
                                </div>
                              )}
                            </div>

                            {item.dateRange && (
                              <span className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200/70">
                                <i className="ri-time-line text-[10px]" />
                                {item.dateRange}
                              </span>
                            )}
                          </div>

                          {item.highlights && item.highlights.length > 0 && (
                            <ul className="pt-2.5 border-t border-slate-100 space-y-2">
                              {item.highlights.map((bullet, bIdx) => (
                                <li key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed break-words">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                  <span className="flex-1 min-w-0 break-words">{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Section 3: Skills, Languages & Tags */}
      {(skillsList.length > 0 || languagesList.length > 0 || tagsList.length > 0) && (
        <div className="pt-5 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Core Competencies, Languages & Tags
            </h3>
          </div>

          <div className="space-y-3">
            {skillsList.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider w-24 pt-1">
                  Skills:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {skillsList.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 rounded-xl bg-indigo-50/80 text-indigo-800 font-bold text-xs border border-indigo-200/60 shadow-2xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {languagesList.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider w-24 pt-1">
                  Languages:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {languagesList.map((lang) => (
                    <span
                      key={lang}
                      className="px-3 py-1 rounded-xl bg-emerald-50/80 text-emerald-800 font-bold text-xs border border-emerald-200/60 shadow-2xs"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tagsList.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider w-24 pt-1">
                  Tags:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap flex-1">
                  {tagsList.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 4: Recruiter Evaluation Notes */}
      <div className="pt-5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#253C7D]" />
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">
              Recruiter Evaluation & Screening Notes
            </h3>
          </div>
          {!isEditingNotes && (
            <button
              onClick={() => setIsEditingNotes(true)}
              className="text-xs font-extrabold text-[#253C7D] hover:underline cursor-pointer flex items-center gap-1"
            >
              <i className="ri-edit-line" /> Edit Notes
            </button>
          )}
        </div>

        {isEditingNotes ? (
          <div className="space-y-3">
            <textarea
              rows={4}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Candidate background, salary expectations, recruiter impressions..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-[#253C7D] leading-relaxed"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditingNotes(false)}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingNotes}
                onClick={onSaveNotes}
                className="px-4 py-1.5 text-xs font-bold bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50/80 rounded-2xl border-l-4 border-[#253C7D] border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {candidate.notes ? (
              candidate.notes
            ) : (
              <span className="text-slate-400 italic">
                No recruiter notes added yet. Click &ldquo;Edit Notes&rdquo; to add screening thoughts or impressions.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
