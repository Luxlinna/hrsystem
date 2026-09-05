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
}: ProfileAvatarSectionProps) {
  const isPhone = isPhoneSyntheticEmail(email);
  const displayContact = isPhone ? formatDisplayPhone(syntheticEmailToPhone(email)) : email;

  return (
    <div className="flex items-center gap-5">
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-20 h-20 rounded-2xl object-cover border border-gray-100 shadow-2xs"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-xl font-bold shadow-2xs">
              {initials}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setEditMenuOpen((v) => !v)}
            disabled={savingCrop || removingAvatar}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <i className="ri-edit-2-line text-[12px]" />
            Edit photo
            <i
              className={`ri-arrow-down-s-line text-[12px] text-gray-400 transition-transform ${
                editMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {editMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setEditMenuOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                <button
                  onClick={() => {
                    setEditMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <i className="ri-upload-2-line text-sm text-gray-400" />
                  Upload new photo
                </button>
                {avatarUrl && (
                  <button
                    onClick={() => {
                      setEditMenuOpen(false);
                      onEditAvatar();
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12px] font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <i className="ri-crop-line text-sm text-gray-400" />
                    Re-crop current photo
                  </button>
                )}
                {avatarUrl && (
                  <button
                    onClick={() => {
                      setEditMenuOpen(false);
                      onRemoveAvatar();
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-[12px] font-medium text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
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
      <div>
        <p className="text-sm font-semibold text-gray-900">{displayName || displayContact}</p>
        <p className="text-[12px] text-gray-500 flex items-center gap-1">
          {isPhone && <i className="ri-phone-line text-gray-400 text-[11px]" />}
          <span>{displayContact}</span>
        </p>
        {savingCrop && <p className="text-[11px] text-[#253C7D] mt-1 font-medium">Uploading photo...</p>}
        {removingAvatar && <p className="text-[11px] text-[#253C7D] mt-1 font-medium">Removing photo...</p>}
      </div>
    </div>
  );
});
