import { memo } from "react";
import type { Candidate } from "../../../types";
import { HIRING_STEPS, type HiringStepId } from "./types";

interface EditHiringModalHeaderProps {
  candidate: Candidate;
  filledCount: number;
  autoSaveStatus: "idle" | "saving" | "saved" | "error";
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  onClose: () => void;
  activeTab: HiringStepId;
  onSelectTab: (tab: HiringStepId) => void;
  currentStepIndex: number;
}

export const EditHiringModalHeader = memo(function EditHiringModalHeader({
  candidate,
  filledCount,
  autoSaveStatus,
  autoSaveEnabled,
  onToggleAutoSave,
  onClose,
  activeTab,
  onSelectTab,
  currentStepIndex,
}: EditHiringModalHeaderProps) {
  return (
    <>
      {/* Modal Top Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#172B4D] via-[#1E3A6D] to-[#253C7D] text-white flex items-center justify-between gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-blue-200 border border-white/10 shrink-0">
            <i className="ri-file-user-line text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black tracking-tight">
                Edit Hiring &amp; Employment Information
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-extrabold uppercase tracking-wider">
                33 Standard Fields
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 font-sans text-[11px] font-bold">
                {filledCount} / 33 Filled ({Math.round((filledCount / 33) * 100)}%)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/75 mt-0.5 font-medium">
              {candidate.candidate_code && (
                <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[11px] text-white font-bold">
                  {candidate.candidate_code}
                </span>
              )}
              <span className="font-bold text-white">{candidate.full_name}</span>
              {candidate.position && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-white/80">{candidate.position}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto-Save Toggle & Status Controller */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xs shadow-inner select-none">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              {autoSaveStatus === "saving" ? (
                <>
                  <div className="w-2.5 h-2.5 border-2 border-sky-300 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sky-300 text-[11px] font-bold">Saving...</span>
                </>
              ) : autoSaveStatus === "saved" ? (
                <>
                  <i className="ri-checkbox-circle-fill text-emerald-400 text-xs" />
                  <span className="text-emerald-300 text-[11px] font-bold">Auto-Saved</span>
                </>
              ) : autoSaveStatus === "error" ? (
                <>
                  <i className="ri-error-warning-fill text-rose-400 text-xs" />
                  <span className="text-rose-300 text-[11px] font-bold">Save Error</span>
                </>
              ) : autoSaveEnabled ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span className="text-emerald-300 text-[11px] font-bold">Auto-Save ON</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-slate-300 text-[11px] font-medium">Auto-Save OFF</span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onToggleAutoSave}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoSaveEnabled ? "bg-emerald-500 hover:bg-emerald-400" : "bg-slate-600 hover:bg-slate-500"
              }`}
              role="switch"
              aria-checked={autoSaveEnabled}
              title={autoSaveEnabled ? "Auto-Save is active. Click to toggle OFF." : "Auto-Save is off. Click to toggle ON."}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  autoSaveEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            title="Close"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="px-6 py-2.5 bg-slate-50/80 border-b border-slate-200/80 shrink-0">
        <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-200/50 rounded-2xl">
          {HIRING_STEPS.map((s, idx) => {
            const isActive = activeTab === s.id;
            const isPast = idx < currentStepIndex;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectTab(s.id)}
                className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer select-none ${
                  isActive
                    ? "bg-white text-[#253C7D] shadow-xs font-black border border-slate-200/70 ring-2 ring-[#253C7D]/10"
                    : isPast
                    ? "text-slate-700 hover:bg-white/60 font-semibold"
                    : "text-slate-500 hover:bg-white/40 hover:text-slate-700 font-medium"
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold transition-all shrink-0 ${
                    isActive
                      ? "bg-[#253C7D] text-white shadow-xs"
                      : isPast
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-300/80 text-slate-600"
                  }`}
                >
                  {isPast ? <i className="ri-check-line text-xs" /> : s.step}
                </span>
                <span className="truncate">{s.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Animated Progress Bar */}
      <div className="w-full bg-slate-100 h-1">
        <div
          className="bg-gradient-to-r from-[#253C7D] via-blue-600 to-indigo-500 h-1 transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / HIRING_STEPS.length) * 100}%` }}
        />
      </div>
    </>
  );
});
