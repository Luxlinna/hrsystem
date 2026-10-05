import { memo } from "react";
import type { CvIngestionSettings } from "./useCandidateCvBank";

interface CandidateCvSettingsTabProps {
  settings: CvIngestionSettings;
  setSettings: React.Dispatch<React.SetStateAction<CvIngestionSettings>>;
  onSave: () => void;
}

export const CandidateCvSettingsTab = memo(function CandidateCvSettingsTab({
  settings,
  setSettings,
  onSave,
}: CandidateCvSettingsTabProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-5">
      {/* OCR & AI Parsing Settings */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-base">
            <i className="ri-cpu-line" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">CV Ingestion &amp; OCR Engine Rules</h3>
            <p className="text-[11px] text-slate-500">Automated candidate resume parsing and text extraction rules</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-800">Auto-Extract Candidate Details</p>
              <p className="text-[11px] text-slate-500">Populate candidate name, phone, education, and skills upon CV upload</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoParseCv}
              onChange={(e) => setSettings({ ...settings, autoParseCv: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-800">OCR Fallback for Scanned PDFs / Photos</p>
              <p className="text-[11px] text-slate-500">Run optical character recognition engine when digital text is empty</p>
            </div>
            <input
              type="checkbox"
              checked={settings.ocrFallback}
              onChange={(e) => setSettings({ ...settings, ocrFallback: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200/80 cursor-pointer transition-colors">
            <div>
              <p className="text-xs font-bold text-slate-800">Duplicate Candidate Detection</p>
              <p className="text-[11px] text-slate-500">Warn when uploaded CV matches an existing applicant in the system</p>
            </div>
            <input
              type="checkbox"
              checked={settings.duplicateDetection}
              onChange={(e) => setSettings({ ...settings, duplicateDetection: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Storage and Constraints */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-base">
            <i className="ri-hard-drive-2-line" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900">Storage &amp; File Constraints</h3>
            <p className="text-[11px] text-slate-500">AWS S3 / Supabase storage bucket limits and file security</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Max Upload Size (MB)</label>
            <input
              type="number"
              min={1}
              max={50}
              value={settings.maxFileSizeMb}
              onChange={(e) => setSettings({ ...settings, maxFileSizeMb: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Storage Status</label>
            <div className="px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl font-bold border border-emerald-200 flex items-center gap-1.5">
              <i className="ri-checkbox-circle-fill text-emerald-600" />
              <span>AWS S3 / Supabase Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onSave}
          className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          Save Ingestion Rules
        </button>
      </div>
    </div>
  );
});
