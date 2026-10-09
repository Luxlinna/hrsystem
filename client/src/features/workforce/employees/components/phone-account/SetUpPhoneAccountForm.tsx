import { memo, useState } from "react";
import type { Employee, AppRole } from "../../types";
import { formatPhoneDisplay } from "@/lib/telegramInvite";
import type { SuccessData } from "./types";

interface SetUpPhoneAccountFormProps {
  employee: Employee;
  roles: AppRole[];
  selectedRoleId: string;
  setSelectedRoleId: (id: string) => void;
  onSubmit: (data: {
    employeeId: string;
    phone: string;
    password?: string;
    displayName: string;
    roleId?: string | number | null;
    sendInvite?: boolean;
  }) => Promise<boolean | string>;
  onSuccess: (data: SuccessData) => void;
  onClose: () => void;
}

export const SetUpPhoneAccountForm = memo(function SetUpPhoneAccountForm({
  employee,
  roles,
  selectedRoleId,
  setSelectedRoleId,
  onSubmit,
  onSuccess,
  onClose,
}: SetUpPhoneAccountFormProps) {
  const [mode, setMode] = useState<"invite" | "manual">("invite");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("This employee does not have a phone number registered.");
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
      const displayName =
        employee.display_name?.trim() ||
        employee.full_name?.trim() ||
        `${employee.last_name || ""} ${employee.first_name || ""}`.trim();
      const res = await onSubmit({
        employeeId: employee.id,
        phone: employee.phone.trim(),
        password: mode === "manual" ? password : undefined,
        displayName,
        roleId: selectedRoleId || null,
        sendInvite: mode === "invite",
      });

      if (res) {
        onSuccess({
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

  const formattedPhone = employee.phone ? formatPhoneDisplay(employee.phone) : "";
  const fullName =
    employee.display_name?.trim() ||
    employee.full_name?.trim() ||
    `${employee.last_name || ""} ${employee.first_name || ""}`.trim() ||
    "Employee";

  return (
    <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs">
      {error && (
        <div className="p-3 rounded-md bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <i className="ri-error-warning-line text-sm shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Employee Info Card */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-md p-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{fullName}</p>
          <p className="text-[11px] text-slate-500">{employee.department || "No Department"} &bull; {employee.position || "Staff"}</p>
        </div>
        <div className="text-right">
          <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
            {formattedPhone || <span className="text-rose-500 font-normal">No phone number</span>}
          </span>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("invite")}
          className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
            mode === "invite"
              ? "border-[#253C7D] bg-blue-50/50 dark:bg-blue-950/20 text-[#253C7D] dark:text-[#7ba3d4]"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <i className="ri-telegram-fill text-base text-[#0284c7]" />
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Telegram Onboarding</span>
          </div>
          <p className="text-[11px] text-slate-500">Send one-time direct setup link to employee</p>
        </button>

        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
            mode === "manual"
              ? "border-[#253C7D] bg-blue-50/50 dark:bg-blue-950/20 text-[#253C7D] dark:text-[#7ba3d4]"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <i className="ri-key-2-line text-base text-[#253C7D]" />
            <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">Direct Password</span>
          </div>
          <p className="text-[11px] text-slate-500">Set initial login password manually</p>
        </button>
      </div>

      {/* Role Selection */}
      <div>
        <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Assigned Role</label>
        <select
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-[#253C7D]"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* Manual Password Input */}
      {mode === "manual" && (
        <div className="space-y-3 pt-1">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 dark:text-slate-300 font-medium">New Password</label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] text-[#253C7D] dark:text-[#7ba3d4] hover:underline font-medium cursor-pointer"
              >
                Auto Generate
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Confirm Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full h-8 px-2.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-[#253C7D]"
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting || !employee.phone?.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <i className={mode === "invite" ? "ri-send-plane-line" : "ri-save-line"} />
              <span>{mode === "invite" ? "Generate Telegram Invite" : "Save Credentials"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
});
