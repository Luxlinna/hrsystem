import { memo } from "react";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";

interface ProfileAvatarSectionProps {
  avatarUrl?: string;
  displayName: string;
  email?: string;
  initials: string;
  savingCrop: boolean;
  removingAvatar: boolean;
  editMenuOpen: boolean;
  setEditMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditAvatar: () => void;
  onRemoveAvatar: () => void;
  roleName?: string;
  department?: string;
}

export const ProfileAvatarSection = memo(function ProfileAvatarSection({
  avatarUrl,
  displayName,
  email,
  initials,
  savingCrop,
  removingAvatar,
  editMenuOpen,
  setEditMenuOpen,
  fileInputRef,
  onAvatarSelect,
  onEditAvatar,
  onRemoveAvatar,
  roleName,
  department,
}: ProfileAvatarSectionProps) {
  const isPhone = isPhoneSyntheticEmail(email);
  const displayContact = isPhone ? formatDisplayPhone(syntheticEmailToPhone(email)) : email;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-1">
      <div className="flex items-center gap-5 min-w-0">
        {/* Avatar with Floating Camera Button */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-slate-100/90 shadow-xs bg-slate-100 flex items-center justify-center">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-2xl font-bold">
                {initials}
              </div>
            )}
          </div>

          {/* Floating Camera Button on Avatar */}
          <button
            type="button"
            onClick={() => setEditMenuOpen((v) => !v)}
            disabled={savingCrop || removingAvatar}
            title="Change photo"
            aria-label="Change photo"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white border border-gray-200/90 shadow-sm flex items-center justify-center text-gray-600 hover:text-[#253C7D] hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-40"
          >
            <i className="ri-camera-fill text-[13px]" />
          </button>
        </div>

        {/* User Details */}
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold text-gray-900 tracking-tight truncate">
              {displayName || displayContact}
            </h2>
            {roleName && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#253C7D] border border-blue-200/60">
                {roleName}
              </span>
            )}
            {department && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                {department}
              </span>
            )}
          </div>

          <p className="text-[13px] text-gray-500 flex items-center gap-1.5 font-normal">
            {isPhone ? (
              <i className="ri-phone-line text-gray-400 text-xs" />
            ) : (
              <i className="ri-mail-line text-gray-400 text-xs" />
            )}
            <span className="truncate">{displayContact}</span>
          </p>

          {savingCrop && (
            <p className="text-[11px] text-[#253C7D] font-medium flex items-center gap-1 pt-0.5">
              <i className="ri-loader-4-line animate-spin" /> Uploading photo...
            </p>
          )}
          {removingAvatar && (
            <p className="text-[11px] text-[#253C7D] font-medium flex items-center gap-1 pt-0.5">
              <i className="ri-loader-4-line animate-spin" /> Removing photo...
            </p>
          )}
        </div>
      </div>

      {/* Edit Photo Action Menu Button */}
      <div className="relative self-start sm:self-center shrink-0">
        <button
          type="button"
          onClick={() => setEditMenuOpen((v) => !v)}
          disabled={savingCrop || removingAvatar}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 rounded-xl text-xs font-semibold shadow-2xs hover:border-slate-300 transition-all cursor-pointer disabled:opacity-40"
        >
          <i className="ri-image-edit-line text-[14px] text-slate-500" />
          <span>Edit photo</span>
          <i
            className={`ri-arrow-down-s-line text-xs text-slate-400 transition-transform ${
              editMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {editMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-30"
              onClick={() => setEditMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl z-40 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setEditMenuOpen(false);
                  fileInputRef.current?.click();
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12px] font-medium text-gray-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <i className="ri-upload-2-line text-sm text-[#253C7D]" />
                Upload new photo
              </button>
              {avatarUrl && (
                <button
                  onClick={() => {
                    setEditMenuOpen(false);
                    onEditAvatar();
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12px] font-medium text-gray-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <i className="ri-crop-line text-sm text-gray-500" />
                  Re-crop current photo
                </button>
              )}
              {avatarUrl && (
                <button
                  onClick={() => {
                    setEditMenuOpen(false);
                    onRemoveAvatar();
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12px] font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <i className="ri-delete-bin-line text-sm" />
                  Remove photo
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hidden input — opened via Upload new photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={onAvatarSelect}
      />
    </div>
  );
});
