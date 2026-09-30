import { memo, useState } from "react";
import {
  formatPhoneDisplay,
  buildTelegramInviteMessage,
  createTelegramDirectChatUrl,
} from "@/lib/telegramInvite";
import type { SuccessData } from "./types";

interface SetUpPhoneAccountSuccessProps {
  successData: SuccessData;
  onClose: () => void;
}

export const SetUpPhoneAccountSuccess = memo(function SetUpPhoneAccountSuccess({
  successData,
  onClose,
}: SetUpPhoneAccountSuccessProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyCredentials = () => {
    if (successData.inviteLink) {
      const msg = buildTelegramInviteMessage({
        name: successData.name,
        phone: successData.phone,
        inviteLink: successData.inviteLink,
      });
      navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } else {
      const text = `Hello ${successData.name},\n\nYour HR System login credentials:\nPhone: ${successData.phone}\nPassword: ${successData.password}\n\nPlease log in at the HR portal using your phone number and password.`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenDirectChat = () => {
    const msg = successData.inviteLink
      ? buildTelegramInviteMessage({
          name: successData.name,
          phone: successData.phone,
          inviteLink: successData.inviteLink,
        })
      : `Hello ${successData.name},\n\nYour HR System login credentials:\nPhone: ${successData.phone}\nPassword: ${successData.password}\n\nPlease sign in with your phone and password.`;

    navigator.clipboard.writeText(msg).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    const chatUrl = createTelegramDirectChatUrl(successData.phone);
    window.open(chatUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLinkOnly = () => {
    if (!successData?.inviteLink) return;
    navigator.clipboard.writeText(successData.inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="p-5 space-y-4 text-xs">
      <div className="p-3.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-2.5">
        <i className="ri-checkbox-circle-fill text-emerald-600 text-base shrink-0 mt-0.5" />
        <div className="text-emerald-900 dark:text-emerald-200 text-xs">
          <p className="font-semibold">
            {successData.inviteLink ? "Telegram Setup Link Ready" : "Account Created Successfully"}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-800 dark:text-emerald-300">
            {successData.inviteLink
              ? `A secure one-time onboarding link has been generated for ${successData.name}.`
              : `Direct credentials have been created for ${successData.name}.`}
          </p>
        </div>
      </div>

      {successData.inviteLink ? (
        <div className="space-y-3">
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-md p-3 space-y-2 font-medium">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Employee:</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{successData.name}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 dark:border-slate-700">
              <span className="text-slate-500">Phone:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{formatPhoneDisplay(successData.phone)}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 dark:border-slate-700">
              <span className="text-slate-500">Link Validity:</span>
              <span className="text-amber-700 dark:text-amber-400 font-semibold">24 Hours</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleOpenDirectChat}
              className="flex-1 py-2 px-3 rounded-md text-xs font-medium text-white bg-[#0284c7] hover:bg-[#0369a1] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <i className="ri-telegram-fill text-sm" />
              <span>Open in Telegram</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLinkOnly}
              className="py-2 px-3 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className={copiedLink ? "ri-check-line text-emerald-600" : "ri-links-line"} />
              <span>{copiedLink ? "Copied" : "Copy Link"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Login Phone:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{formatPhoneDisplay(successData.phone)}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 dark:border-slate-700">
              <span className="text-slate-500">Password:</span>
              <span className="font-mono text-[#253C7D] dark:text-[#7ba3d4] font-bold">{successData.password}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopyCredentials}
              className="flex-1 py-2 px-3 rounded-md text-xs font-medium text-white bg-[#253C7D] hover:bg-[#1E3066] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <i className={copied ? "ri-check-line" : "ri-file-copy-line"} />
              <span>{copied ? "Copied to Clipboard!" : "Copy Full Message"}</span>
            </button>
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
});
