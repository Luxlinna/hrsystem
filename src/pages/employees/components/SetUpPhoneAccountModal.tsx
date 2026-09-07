import React, { useState } from "react";
import type { Employee, AppRole } from "../types";
import {
  formatPhoneDisplay,
  toE164Phone,
  buildTelegramInviteMessage,
  createTelegramDirectChatUrl,
} from "@/lib/telegramInvite";

interface SetUpPhoneAccountModalProps {
  employee: Employee | null;
  roles: AppRole[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employeeId: string;
    phone: string;
    password?: string;
    displayName: string;
    roleId?: string | number | null;
    sendInvite?: boolean;
  }) => Promise<boolean | string>;
}

export function SetUpPhoneAccountModal({
  employee,
  roles,
  isOpen,
  onClose,
  onSubmit,
}: SetUpPhoneAccountModalProps) {
  const [mode, setMode] = useState<"invite" | "manual">("invite");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success state for either invite link or manual password
  const [successData, setSuccessData] = useState<{
    phone: string;
    name: string;
    password?: string;
    inviteLink?: string;
  } | null>(null);

  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initialize form when opened or employee changes
  React.useEffect(() => {
    if (isOpen && employee) {
      setMode("invite");
      setPassword("");
      setConfirmPassword("");
      setError(null);
      setSuccessData(null);
      setCopied(false);
      setCopiedLink(false);

      // Preselect matching role if possible
      const matchedRole = roles.find(
        (r) => r.name.toLowerCase() === (employee.role || "staff").toLowerCase()
      );
      if (matchedRole) {
        setSelectedRoleId(String(matchedRole.id));
      } else if (roles.length > 0) {
        const staffRole = roles.find((r) => r.name.toLowerCase() === "staff");
        setSelectedRoleId(staffRole ? String(staffRole.id) : String(roles[0].id));
      }
    }
  }, [isOpen, employee, roles]);

  if (!isOpen || !employee) return null;

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `Staff#${rand}`;
    setPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
    setError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employee.phone?.trim()) {
      setError("This employee does not have a phone number.");
      return;
    }

    if (mode === "manual") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const displayName = `${employee.first_name} ${employee.last_name}`.trim();
      const res = await onSubmit({
        employeeId: employee.id,
        phone: employee.phone.trim(),
        password: mode === "manual" ? password : undefined,
        displayName,
        roleId: selectedRoleId || null,
        sendInvite: mode === "invite",
      });

      if (res) {
        setSuccessData({
          phone: employee.phone.trim(),
          name: displayName,
          password: mode === "manual" ? password : undefined,
          inviteLink: typeof res === "string" ? res : undefined,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to set up account.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!successData) return;
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
      const text = `Hello ${successData.name},\n\nYour HR System login details:\nPhone: ${successData.phone}\nPassword: ${successData.password}\n\nPlease sign in at the login page using your phone number and password.`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleOpenDirectChat = () => {
    if (!successData) return;
    const msg = successData.inviteLink
      ? buildTelegramInviteMessage({
          name: successData.name,
          phone: successData.phone,
          inviteLink: successData.inviteLink,
        })
      : `Hello ${successData.name},\n\nYour HR System login details:\nPhone: ${successData.phone}\nPassword: ${successData.password}\n\nPlease sign in with your phone and password.`;

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

  const formattedPhone = employee.phone ? formatPhoneDisplay(employee.phone) : "";
  const e164Phone = employee.phone ? toE164Phone(employee.phone) : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-sky-500/10 via-[#253C7D]/5 to-indigo-50/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#229ED9] to-[#253C7D] text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <i className={successData ? "ri-check-double-line text-xl" : "ri-phone-lock-line text-lg"} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                {successData ? "Account Ready!" : "Set Up Phone Account"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {successData
                  ? successData.inviteLink
                    ? "Telegram setup link generated"
                    : "Password created for phone login"
                  : "Invite via Telegram or create password"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Success View */}
        {successData ? (
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-check-line text-lg font-bold" />
              </div>
              <div className="text-xs text-emerald-900">
                <p className="font-bold text-sm text-emerald-950 mb-0.5">
                  {successData.inviteLink ? "Telegram Invite Ready!" : "Account Successfully Created"}
                </p>
                <p>
                  {successData.inviteLink ? (
                    <>
                      A secure 24-hour setup link has been created for <strong>{successData.name}</strong>. Send it via Telegram below.
                    </>
                  ) : (
                    <>
                      <strong>{successData.name}</strong> can now log in using their phone number and the password below.
                    </>
                  )}
                </p>
              </div>
            </div>

            {successData.inviteLink ? (
              /* Invite Link Success Box */
              <div className="space-y-3">
                <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-sky-800 font-medium">Recipient:</span>
                    <span className="font-bold text-sky-950">{successData.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-sky-200/60">
                    <span className="text-sky-800 font-medium">Login Phone:</span>
                    <span className="font-mono font-bold text-sky-950">{formatPhoneDisplay(successData.phone)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-sky-200/60">
                    <span className="text-sky-800 font-medium">Link Expiry:</span>
                    <span className="font-semibold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded text-[11px]">
                      Valid for 24 Hours
                    </span>
                  </div>
                </div>

                {/* Telegram Actions */}
                <button
                  type="button"
                  onClick={handleOpenDirectChat}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#229ED9] to-[#2AABEE] hover:from-[#1e8cc0] hover:to-[#229ed9] transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 cursor-pointer active:scale-[0.99]"
                >
                  <i className="ri-telegram-fill text-base" />
                  <span>Open Telegram Chat {toE164Phone(successData.phone) ? `(${toE164Phone(successData.phone)})` : ""}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      copied
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <i className={copied ? "ri-check-line text-emerald-600 text-sm" : "ri-file-copy-line text-sm"} />
                    <span>{copied ? "Copied!" : "Copy Message"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyLinkOnly}
                    className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      copiedLink
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <i className={copiedLink ? "ri-check-line text-emerald-600 text-sm" : "ri-link text-sm"} />
                    <span>{copiedLink ? "Link Copied!" : "Copy Link"}</span>
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 text-center pt-0.5">
                  💡 Opening chat automatically copies the message so you can paste (Ctrl+V) and send.
                </p>
              </div>
            ) : (
              /* Manual Password Success Box */
              <div className="space-y-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Login Phone:</span>
                    <span className="font-mono font-bold text-gray-900">{successData.phone}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
                    <span className="text-gray-500 font-medium">Initial Password:</span>
                    <span className="font-mono font-bold text-[#253C7D]">{successData.password}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenDirectChat}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#229ED9] to-[#2AABEE] hover:from-[#1e8cc0] hover:to-[#229ed9] transition-all flex items-center justify-center gap-2 shadow-md shadow-sky-500/20 cursor-pointer active:scale-[0.99]"
                >
                  <i className="ri-telegram-fill text-base" />
                  <span>Open Telegram Chat {toE164Phone(successData.phone) ? `(${toE164Phone(successData.phone)})` : ""}</span>
                </button>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCredentials}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      copied
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <i className={copied ? "ri-check-line text-emerald-600 text-sm" : "ri-file-copy-line text-sm"} />
                    <span>{copied ? "Copied!" : "Copy Login Info"}</span>
                  </button>
                </div>

                <p className="text-[11px] text-gray-500 text-center pt-0.5">
                  💡 Opening chat copies the login details so you can paste (Ctrl+V) and send.
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close & Done
              </button>
            </div>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
            {/* Employee Card */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#253C7D] to-blue-500 text-white flex items-center justify-center font-bold text-xs">
                  {employee.first_name[0]}
                  {employee.last_name[0]}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">
                    {employee.first_name} {employee.last_name}
                  </p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <i className="ri-phone-fill text-gray-400 text-[10px]" />
                    <span className="font-semibold">{formattedPhone || employee.phone || "No phone"}</span>
                    {e164Phone && <span className="text-gray-400 font-mono">({e164Phone})</span>}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                {employee.branches?.name || "Branch Staff"}
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode("invite")}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "invite"
                    ? "bg-white text-sky-700 shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-telegram-fill text-sm text-[#229ED9]" />
                <span>Invite via Telegram</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === "manual"
                    ? "bg-white text-[#253C7D] shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-key-2-line text-sm text-gray-600" />
                <span>Set Password</span>
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <i className="ri-error-warning-line text-sm shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Role assignment */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Assign System Role *
              </label>
              <select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {mode === "invite" ? (
              /* Telegram Invite Description */
              <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-sky-950">
                  <span className="flex items-center gap-1.5">
                    <i className="ri-telegram-fill text-[#229ED9] text-base" />
                    Zero-Cost Telegram Invite
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                    Free $0.00
                  </span>
                </div>
                <p className="text-[11px] text-sky-850 leading-relaxed">
                  Generates a secure 24-hour setup link. You can open their Telegram chat directly and paste the message to invite them. The employee sets their own password.
                </p>
              </div>
            ) : (
              /* Manual Password Fields */
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-gray-700">
                      Initial Password *
                    </label>
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="text-[11px] font-bold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <i className="ri-magic-line text-xs" />
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required={mode === "manual"}
                      minLength={6}
                      className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <i className={showPassword ? "ri-eye-off-line text-sm" : "ri-eye-line text-sm"} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter the password"
                    required={mode === "manual"}
                    minLength={6}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]"
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 ${
                  mode === "invite"
                    ? "bg-gradient-to-r from-[#229ED9] to-[#2AABEE] hover:from-[#1e8cc0] hover:to-[#229ed9]"
                    : "bg-[#253C7D] hover:bg-[#1d3066]"
                }`}
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm" />
                    <span>Processing...</span>
                  </>
                ) : mode === "invite" ? (
                  <>
                    <i className="ri-telegram-fill text-sm" />
                    <span>Generate Telegram Invite</span>
                  </>
                ) : (
                  <>
                    <i className="ri-shield-keyhole-line text-sm" />
                    <span>Create Account &amp; Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
