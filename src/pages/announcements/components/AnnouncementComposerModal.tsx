import React, { memo, useRef, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { AnnouncementFormState, ComposerMode } from "../types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG, AUDIENCE_CONFIG, QUICK_EMOJIS } from "../constants";

interface AnnouncementComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: string | null;
  form: AnnouncementFormState;
  setForm: React.Dispatch<React.SetStateAction<AnnouncementFormState>>;
  submitting: boolean;
  composerMode: ComposerMode;
  setComposerMode: (mode: ComposerMode) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSuperAdmin?: boolean;
  userBranchName?: string;
  userBranchId?: string | null;
}

export const AnnouncementComposerModal = memo(function AnnouncementComposerModal({
  isOpen,
  onClose,
  editingId,
  form,
  setForm,
  submitting,
  composerMode,
  setComposerMode,
  onSubmit,
  isSuperAdmin = false,
  userBranchName = "Main Branch",
  userBranchId = null,
}: AnnouncementComposerModalProps) {
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const audienceDropdownRef = useRef<HTMLDivElement>(null);

  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [audienceDropdownOpen, setAudienceDropdownOpen] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string; color?: string }[]>([]);

  useEffect(() => {
    supabase
      .from("app_roles")
      .select("id, name, color")
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setRoles(data);
        }
      });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setCategoryDropdownOpen(false);
      }
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(e.target as Node)
      ) {
        setPriorityDropdownOpen(false);
      }
      if (
        audienceDropdownRef.current &&
        !audienceDropdownRef.current.contains(e.target as Node)
      ) {
        setAudienceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAudienceDisplay = (val: string) => {
    if (val === "all") return { label: "All Staff (Everyone)", icon: "ri-global-line", color: "#253C7D" };
    if (val === "hq") return { label: "HQ Staff Only", icon: "ri-building-line", color: "#475569" };
    if (val === "management") return { label: "Management Only", icon: "ri-shield-user-line", color: "#7C3AED" };
    const matchedRole = roles.find(
      (r) => r.name.toLowerCase() === val.toLowerCase() || String(r.id) === val
    );
    if (matchedRole) {
      return {
        label: `Role: ${matchedRole.name}`,
        icon: "ri-user-star-line",
        color: matchedRole.color || "#253C7D",
      };
    }
    return { label: val, icon: "ri-user-settings-line", color: "#253C7D" };
  };

  if (!isOpen) return null;

  const handleInsertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = contentInputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = form.content;
    const selectedText = previousContent.substring(start, end);
    const replacement = `${prefix}${selectedText || "text"}${suffix}`;
    const newContent = previousContent.substring(0, start) + replacement + previousContent.substring(end);
    setForm((prev) => ({ ...prev, content: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText ? selectedText.length : 4));
    }, 0);
  };

  const handleInsertEmoji = (emoji: string) => {
    setForm((prev) => ({ ...prev, content: prev.content + " " + emoji }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-gray-50/50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              <i className={editingId ? "ri-edit-line" : "ri-megaphone-line"} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                {editingId ? "Edit Company Announcement" : "Create Broadcast Announcement"}
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                {editingId ? "Update announcement parameters and messaging" : "Broadcast company news, operational updates, and policies"}
              </p>
            </div>
          </div>

          {/* Mode Toggle & Close Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 p-0.5 rounded-xl border border-gray-200/60">
              <button
                type="button"
                onClick={() => setComposerMode("write")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  composerMode === "write" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-pencil-line" />
                <span>Composer</span>
              </button>
              <button
                type="button"
                onClick={() => setComposerMode("preview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  composerMode === "preview" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-eye-line" />
                <span>Card Preview</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* Modal Body / Tab Content */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {composerMode === "write" ? (
            <>
              {/* Branch Scope Banner */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-extrabold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ri-building-line text-[#253C7D]" />
                    Branch Distribution Scope
                  </span>
                  {isSuperAdmin ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      Super Admin Authority
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                      <i className="ri-lock-line text-xs" />
                      Branch Locked
                    </span>
                  )}
                </div>

                {isSuperAdmin ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, branch_id: null }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        form.branch_id === null
                          ? "bg-white border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                          : "bg-white/60 border-gray-200 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${form.branch_id === null ? "border-[#253C7D] bg-[#253C7D]" : "border-gray-300"}`}>
                          {form.branch_id === null && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs font-bold text-gray-900">All Branches (Global)</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 ml-5.5">Visible to all partner branches across the company</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, branch_id: userBranchId }))}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        form.branch_id !== null
                          ? "bg-white border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                          : "bg-white/60 border-gray-200 text-gray-500 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${form.branch_id !== null ? "border-[#253C7D] bg-[#253C7D]" : "border-gray-300"}`}>
                          {form.branch_id !== null && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs font-bold text-gray-900 truncate">{userBranchName || "Current Branch"}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 ml-5.5">Restricted strictly to users in this branch</p>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#253C7D] flex items-center justify-center font-bold text-xs">
                        <i className="ri-community-line" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{userBranchName || "Your Home Branch"}</p>
                        <p className="text-[10px] text-gray-400">Only users in your branch can view this announcement</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Branch Isolated
                    </span>
                  </div>
                )}
              </div>

              {/* Category & Priority Dropdowns in a 2-column grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Announcement Category Dropdown */}
                <div className="relative" ref={categoryDropdownRef}>
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Announcement Category <span className="text-rose-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setCategoryDropdownOpen((prev) => !prev);
                      setPriorityDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-white border rounded-xl text-xs text-left font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      categoryDropdownOpen
                        ? "border-[#253C7D] ring-2 ring-[#253C7D]/10 bg-white"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${
                          CATEGORY_CONFIG[form.category]?.bg || "bg-slate-100"
                        } ${CATEGORY_CONFIG[form.category]?.color || "text-slate-600"}`}
                      >
                        <i className={CATEGORY_CONFIG[form.category]?.icon || "ri-megaphone-line"} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {CATEGORY_CONFIG[form.category]?.label || "Select Category"}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {CATEGORY_CONFIG[form.category]?.desc || ""}
                        </p>
                      </div>
                    </div>

                    <i
                      className={`ri-arrow-down-s-line text-gray-400 text-base transition-transform duration-200 shrink-0 ${
                        categoryDropdownOpen ? "rotate-180 text-[#253C7D]" : ""
                      }`}
                    />
                  </button>

                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                      {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                        const isSelected = form.category === key;
                        return (
                          <div
                            key={key}
                            onClick={() => {
                              setForm((prev) => ({ ...prev, category: key }));
                              setCategoryDropdownOpen(false);
                            }}
                            className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs ${
                              isSelected
                                ? "bg-[#253C7D]/10 text-[#253C7D]"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${cfg.bg} ${cfg.color}`}
                              >
                                <i className={cfg.icon} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">{cfg.label}</p>
                                <p className="text-[10px] text-gray-400 truncate">{cfg.desc}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <i className="ri-checkbox-circle-fill text-[#253C7D] text-sm shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Priority & Urgency Level Dropdown */}
                <div className="relative" ref={priorityDropdownRef}>
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Priority & Urgency Level <span className="text-rose-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setPriorityDropdownOpen((prev) => !prev);
                      setCategoryDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-white border rounded-xl text-xs text-left font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      priorityDropdownOpen
                        ? "border-[#253C7D] ring-2 ring-[#253C7D]/10 bg-white"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                          PRIORITY_CONFIG[form.priority]?.dot || "bg-gray-400"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {PRIORITY_CONFIG[form.priority]?.label || "Select Priority"}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {PRIORITY_CONFIG[form.priority]?.desc || ""}
                        </p>
                      </div>
                    </div>

                    <i
                      className={`ri-arrow-down-s-line text-gray-400 text-base transition-transform duration-200 shrink-0 ${
                        priorityDropdownOpen ? "rotate-180 text-[#253C7D]" : ""
                      }`}
                    />
                  </button>

                  {priorityDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100">
                      {Object.entries(PRIORITY_CONFIG).map(([key, pri]) => {
                        const isSelected = form.priority === key;
                        return (
                          <div
                            key={key}
                            onClick={() => {
                              setForm((prev) => ({ ...prev, priority: key }));
                              setPriorityDropdownOpen(false);
                            }}
                            className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs ${
                              isSelected
                                ? "bg-[#253C7D]/10 text-[#253C7D]"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${pri.dot}`} />
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">{pri.label}</p>
                                <p className="text-[10px] text-gray-400 truncate">{pri.desc}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <i className="ri-checkbox-circle-fill text-[#253C7D] text-sm shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {form.priority === "urgent" && (
                <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/70">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <label className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider block mb-1">
                        Urgent Alert Duration
                      </label>
                      <p className="text-[11px] text-rose-700/70 font-medium">
                        Staff will be alerted every 30 seconds until accepted or until this time expires.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number"
                        min={1}
                        max={168}
                        value={form.urgent_alert_hours}
                        onChange={(e) => {
                          const nextValue = Math.min(168, Math.max(1, Number(e.target.value) || 1));
                          setForm((prev) => ({ ...prev, urgent_alert_hours: nextValue }));
                        }}
                        className="w-20 px-3 py-2 bg-white border border-rose-200 rounded-xl text-sm font-extrabold text-rose-800 focus:outline-none focus:border-rose-500"
                      />
                      <span className="text-xs font-bold text-rose-700">hours</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Announcement Title */}
              <div>
                <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Headline Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Annual Company All-Hands Meeting & Q3 Review"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] shadow-2xs"
                />
              </div>

              {/* Audience & Author details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Target Audience Dropdown (By Role) */}
                <div className="relative" ref={audienceDropdownRef}>
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Target Audience (By Role) <span className="text-rose-500">*</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setAudienceDropdownOpen((prev) => !prev);
                      setCategoryDropdownOpen(false);
                      setPriorityDropdownOpen(false);
                    }}
                    className={`w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-white border rounded-xl text-xs text-left font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      audienceDropdownOpen
                        ? "border-[#253C7D] ring-2 ring-[#253C7D]/10 bg-white"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 bg-[#253C7D]/10 text-[#253C7D]"
                        style={{ color: getAudienceDisplay(form.visible_to).color }}
                      >
                        <i className={getAudienceDisplay(form.visible_to).icon} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">
                          {getAudienceDisplay(form.visible_to).label}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {form.visible_to === "all"
                            ? "All company & branch members"
                            : form.visible_to === "management"
                            ? "Managers, Leads & Admins"
                            : form.visible_to === "hq"
                            ? "HQ Office staff only"
                            : `Target only ${getAudienceDisplay(form.visible_to).label} role`}
                        </p>
                      </div>
                    </div>

                    <i
                      className={`ri-arrow-down-s-line text-gray-400 text-base transition-transform duration-200 shrink-0 ${
                        audienceDropdownOpen ? "rotate-180 text-[#253C7D]" : ""
                      }`}
                    />
                  </button>

                  {audienceDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-1.5 space-y-1 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                      {/* Standard Scopes */}
                      <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        General Scopes
                      </div>
                      {[
                        { key: "all", label: "All Staff (Everyone)", icon: "ri-global-line", desc: "All company & branch members" },
                        { key: "management", label: "Management Only", icon: "ri-shield-user-line", desc: "Managers, Leads & Admins" },
                        { key: "hq", label: "HQ Staff Only", icon: "ri-building-line", desc: "HQ Office members only" },
                      ].map((item) => {
                        const isSelected = form.visible_to === item.key;
                        return (
                          <div
                            key={item.key}
                            onClick={() => {
                              setForm((prev) => ({ ...prev, visible_to: item.key }));
                              setAudienceDropdownOpen(false);
                            }}
                            className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs ${
                              isSelected
                                ? "bg-[#253C7D]/10 text-[#253C7D]"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-sm shrink-0">
                                <i className={item.icon} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">{item.label}</p>
                                <p className="text-[10px] text-gray-400 truncate">{item.desc}</p>
                              </div>
                            </div>
                            {isSelected && (
                              <i className="ri-checkbox-circle-fill text-[#253C7D] text-sm shrink-0" />
                            )}
                          </div>
                        );
                      })}

                      {/* By Specific Role Target */}
                      {roles.length > 0 && (
                        <>
                          <div className="px-2 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-t border-gray-100">
                            By Specific Role Target
                          </div>
                          {roles.map((r) => {
                            const isSelected = form.visible_to.toLowerCase() === r.name.toLowerCase();
                            return (
                              <div
                                key={r.id}
                                onClick={() => {
                                  setForm((prev) => ({ ...prev, visible_to: r.name }));
                                  setAudienceDropdownOpen(false);
                                }}
                                className={`p-2 rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs ${
                                  isSelected
                                    ? "bg-[#253C7D]/10 text-[#253C7D]"
                                    : "hover:bg-gray-50 text-gray-700"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0"
                                    style={{
                                      backgroundColor: `${r.color || "#253C7D"}18`,
                                      color: r.color || "#253C7D",
                                    }}
                                  >
                                    <i className="ri-user-star-line" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{r.name}</p>
                                    <p className="text-[10px] text-gray-400 truncate">Target only users with {r.name} role</p>
                                  </div>
                                </div>
                                {isSelected && (
                                  <i className="ri-checkbox-circle-fill text-[#253C7D] text-sm shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Author & Role */}
                <div>
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Issuer / Author Details
                  </label>
                  <div className="flex items-center gap-2 p-2 bg-slate-50 border border-gray-200 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-[#253C7D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {form.author_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{form.author_name}</p>
                      <p className="text-[10px] text-gray-400 truncate">{form.author_role}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Announcement Message Body + Quick Formatting Toolbar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                    Broadcast Message Body <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    {form.content.length} characters
                  </span>
                </div>

                {/* Formatting Helper Toolbar */}
                <div className="flex items-center gap-1 p-1 bg-gray-100 border border-gray-200 border-b-0 rounded-t-xl overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting("**", "**")}
                    className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-black text-gray-700 transition-colors cursor-pointer"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting("*", "*")}
                    className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs italic font-serif text-gray-700 transition-colors cursor-pointer"
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting("• ")}
                    className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                    title="Bullet List"
                  >
                    <i className="ri-list-unordered" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting("1. ")}
                    className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                    title="Numbered List"
                  >
                    <i className="ri-list-ordered" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertFormatting("> ")}
                    className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                    title="Quote / Callout"
                  >
                    <i className="ri-double-quotes-l" />
                  </button>

                  <div className="h-4 w-px bg-gray-300 mx-1" />

                  {/* Emojis */}
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="px-1.5 py-0.5 hover:bg-white rounded text-xs transition-colors cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={contentInputRef}
                  required
                  rows={5}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Write complete broadcast details, schedules, key contact points, and instructions for team members..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-b-xl text-xs sm:text-sm text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] leading-relaxed resize-none shadow-2xs"
                />
              </div>

              {/* Pin to Top Toggle Banner */}
              <div
                onClick={() => setForm((prev) => ({ ...prev, pinned: !prev.pinned }))}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  form.pinned
                    ? "bg-amber-50/70 border-amber-200 text-amber-900"
                    : "bg-slate-50 border-gray-200/80 text-gray-700 hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${
                      form.pinned ? "bg-amber-100 text-amber-700" : "bg-white text-gray-400 border border-gray-200"
                    }`}
                  >
                    <i className="ri-pushpin-fill" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold">Pin Announcement to Top</p>
                    <p className="text-[11px] text-gray-400">
                      Featured at the very top of all staff feeds and dashboards
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={form.pinned}
                  onChange={(e) => setForm((prev) => ({ ...prev, pinned: e.target.checked }))}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </div>
            </>
          ) : (
            /* LIVE PREVIEW MODE */
            <div className="space-y-4 py-2">
              <div className="p-3 bg-[#253C7D]/5 border border-[#253C7D]/15 rounded-2xl text-xs text-[#253C7D] flex items-center gap-2">
                <i className="ri-eye-line text-base shrink-0" />
                <span>This is a live preview of how your announcement card will appear on employee feeds:</span>
              </div>

              {/* Simulated Card */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-md relative overflow-hidden">
                {form.priority === "urgent" && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500" />}

                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const cat = CATEGORY_CONFIG[form.category] || CATEGORY_CONFIG.news;
                      const pri = PRIORITY_CONFIG[form.priority] || PRIORITY_CONFIG.normal;
                      return (
                        <>
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold border shrink-0 ${cat.bg} ${cat.color}`}>
                            <i className={cat.icon} />
                          </div>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
                            {cat.label}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${pri.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
                            {pri.label}
                          </span>
                          {form.pinned && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                              <i className="ri-pushpin-fill text-xs" /> Pinned
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold">Just now</span>
                </div>

                <h3 className="font-extrabold text-gray-900 text-base leading-snug mb-2">
                  {form.title || "Untitled Announcement"}
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line mb-4">
                  {form.content || "Your announcement content will be rendered here..."}
                </p>

                {form.priority === "urgent" && (
                  <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs font-bold">
                    <i className="ri-error-warning-line text-sm" />
                    <span>Requires staff acknowledgment for {form.urgent_alert_hours} hours</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-[10px] font-extrabold">
                      {form.author_name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-gray-700">{form.author_name}</span>
                    <span>·</span>
                    <span className="capitalize">{AUDIENCE_CONFIG[form.visible_to]?.label || "All Employees"}</span>
                  </div>
                  <span>0 views</span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 flex gap-2.5 border-t border-gray-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.title.trim()}
              className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <i className="ri-send-plane-fill text-sm" />
              <span>
                {submitting
                  ? "Publishing Broadcast..."
                  : editingId
                  ? "Save Changes"
                  : "Publish Announcement"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
