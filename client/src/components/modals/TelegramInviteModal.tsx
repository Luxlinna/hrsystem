import React, { useState } from "react";
import {
  formatPhoneDisplay,
  toE164Phone,
  buildTelegramInviteMessage,
  createTelegramDirectChatUrl,
} from "@/lib/telegramInvite";

export interface TelegramInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  phone: string;
  inviteLink: string;
  roleName?: string;
}

export function TelegramInviteModal({
  isOpen,
  onClose,
  employeeName,
  phone,
  inviteLink,
  roleName,
}: TelegramInviteModalProps) {
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const fullMessage = buildTelegramInviteMessage({
    name: employeeName,
    phone,
    inviteLink,
  });

  const formattedPhone = formatPhoneDisplay(phone);
  const e164Phone = toE164Phone(phone);

  const handleOpenDirectChat = () => {
    navigator.clipboard.writeText(fullMessage).catch(() => {});
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
    const chatUrl = createTelegramDirectChatUrl(phone);
    window.open(chatUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(fullMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2500);
  };

  const handleCopyLinkOnly = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Compact Header with Recipient & Status */}
        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-[#253C7D]/5 to-indigo-50/20 dark:from-sky-950/40 dark:via-slate-900 dark:to-indigo-950/20 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#229ED9] to-[#2AABEE] text-white flex items-center justify-center shadow-xs shrink-0">
              <i className="ri-telegram-fill text-xl" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm truncate">
                  {employeeName}
                </h3>
                {roleName && (
                  <span className="text-[10px] font-semibold text-blue-800 dark:text-sky-300 bg-blue-50 dark:bg-sky-950/60 border border-blue-200 dark:border-sky-800/60 px-1.5 py-0.2 rounded">
                    {roleName}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-medium text-gray-700 dark:text-slate-300">{formattedPhone}</span>
                <span className="text-gray-300 dark:text-slate-600">•</span>
                <span className="text-amber-700 dark:text-amber-400 font-medium">Valid 24h</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Compact Content Body (No Vertical or Horizontal Scrolling Needed) */}
        <div className="p-5 space-y-3 min-w-0">
          {/* Message Preview Box */}
          <div className="space-y-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                <i className="ri-chat-smile-2-line text-sky-600 dark:text-sky-400 text-xs" />
                <span>Invitation Message</span>
              </span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="text-[11px] font-semibold text-[#253C7D] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <i className={copiedMessage ? "ri-check-line text-xs text-emerald-600 dark:text-emerald-400" : "ri-file-copy-line text-xs"} />
                <span>{copiedMessage ? "Copied!" : "Copy Text"}</span>
              </button>
            </div>

            <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/50 rounded-xl text-xs text-gray-800 dark:text-slate-200 space-y-2 min-w-0">
              <p className="text-gray-900 dark:text-slate-100 leading-snug">
                👋 Hello <strong>{employeeName}</strong>, you have been invited to join <strong>HR System</strong>!
              </p>

              {/* Password Setup Link Card */}
              <div className="p-2 bg-white dark:bg-slate-800/90 border border-sky-200 dark:border-sky-900/60 rounded-lg flex items-center justify-between gap-2 min-w-0 shadow-2xs">
                <div className="flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-slate-300 font-mono truncate min-w-0">
                  <i className="ri-link text-sky-600 dark:text-sky-400 text-xs shrink-0" />
                  <span className="truncate">{inviteLink}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyLinkOnly}
                  className="text-[10px] font-bold text-sky-700 dark:text-sky-300 hover:text-sky-900 dark:hover:text-white bg-sky-50 dark:bg-sky-900/50 hover:bg-sky-100 dark:hover:bg-sky-900/80 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedLink ? "Copied!" : "Copy Link"}
                </button>
              </div>

              <div className="text-[10.5px] text-gray-500 dark:text-slate-400 flex items-center justify-between pt-0.5 border-t border-sky-200/40 dark:border-sky-900/40">
                <span>📱 Login with phone: <strong>{formattedPhone}</strong></span>
                <span className="text-amber-700 dark:text-amber-400 font-medium">Expires in 24 hours</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1 min-w-0">
            <button
              type="button"
              onClick={handleOpenDirectChat}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#229ED9] to-[#2AABEE] hover:from-[#1e8cc0] hover:to-[#229ed9] transition-all flex items-center justify-center gap-2 shadow-sm shadow-sky-500/20 cursor-pointer active:scale-[0.99]"
            >
              <i className="ri-telegram-fill text-base" />
              <span>Open Telegram Chat {e164Phone ? `(${e164Phone})` : ""}</span>
            </button>

            <div className="grid grid-cols-2 gap-2 min-w-0">
              <button
                type="button"
                onClick={handleCopyMessage}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
                  copiedMessage
                    ? "border-emerald-500 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                    : "border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <i
                  className={
                    copiedMessage
                      ? "ri-check-double-line text-emerald-600 dark:text-emerald-400 text-sm shrink-0"
                      : "ri-file-copy-line text-sm shrink-0"
                  }
                />
                <span className="truncate">{copiedMessage ? "Copied!" : "Copy Message"}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLinkOnly}
                className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
                  copiedLink
                    ? "border-emerald-500 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                    : "border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
                }`}
              >
                <i className={copiedLink ? "ri-check-line text-emerald-600 dark:text-emerald-400 text-sm shrink-0" : "ri-link text-sm shrink-0"} />
                <span className="truncate">{copiedLink ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>

            <p className="text-[10.5px] text-gray-500 dark:text-slate-400 text-center pt-0.5">
              💡 Opening chat automatically copies the message so you can paste (Ctrl+V) and send.
            </p>
          </div>
        </div>

        {/* Slim Footer */}
        <div className="px-5 py-2.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <p className="text-[10.5px] text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <i className="ri-shield-check-line text-emerald-600 dark:text-emerald-400 text-xs" />
            <span>Employee sets password safely</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
