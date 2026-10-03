import { memo } from "react";

interface Props {
  editing: boolean;
  saving: boolean;
  onSave: () => void;
}

export const ProfileEditStickyBar = memo(function ProfileEditStickyBar({
  editing,
  saving,
  onSave,
}: Props) {
  if (!editing) return null;

  return (
    <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 bg-[#1E293B] text-white rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
          <i className="ri-edit-line" />
        </div>
        <div>
          <p className="text-xs font-bold text-white">Profile Edit Mode Active</p>
          <p className="text-[11px] text-slate-300">
            Ensure all personal, identification, family, and achievement details are saved.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-black rounded-xl cursor-pointer shadow-sm transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 border border-blue-400/30"
        >
          {saving ? (
            <>
              <i className="ri-loader-4-line animate-spin" />
              <span>Saving Profile...</span>
            </>
          ) : (
            <>
              <i className="ri-check-line text-sm" />
              <span>Save All Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});
