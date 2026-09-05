import React, { useState } from "react";
import type { Employee, AppRole } from "../types";

interface SetUpPhoneAccountModalProps {
  employee: Employee | null;
  roles: AppRole[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employeeId: string;
    phone: string;
    password: string;
    displayName: string;
    roleId?: string | number | null;
  }) => Promise<boolean>;
}

export function SetUpPhoneAccountModal({
  employee,
  roles,
  isOpen,
  onClose,
  onSubmit,
}: SetUpPhoneAccountModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    phone: string;
    password: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize form when opened or employee changes
  React.useEffect(() => {
    if (isOpen && employee) {
      setPassword("");
      setConfirmPassword("");
      setError(null);
      setSuccessData(null);
      setCopied(false);

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

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const displayName = `${employee.first_name} ${employee.last_name}`.trim();
      const success = await onSubmit({
        employeeId: employee.id,
        phone: employee.phone.trim(),
        password,
        displayName,
        roleId: selectedRoleId || null,
      });

      if (success) {
        setSuccessData({
          phone: employee.phone.trim(),
          password,
          name: displayName,
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
    const text = `Hello ${successData.name},\n\nYour HR System login details:\nPhone: ${successData.phone}\nPassword: ${successData.password}\n\nPlease sign in at the login page using your phone number and password.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#253C7D]/5 to-indigo-50/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center shadow-md shadow-[#253C7D]/20">
              <i className="ri-phone-lock-line text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                {successData ? "Account Ready!" : "Set Up Phone Account"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {successData
                  ? "Account and initial password created"
                  : "Create password for phone login"}
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
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-check-line text-lg font-bold" />
              </div>
              <div className="text-xs text-emerald-900">
                <p className="font-bold text-sm text-emerald-950 mb-0.5">
                  Account Successfully Created
                </p>
                <p>
                  <strong>{successData.name}</strong> can now log in using their phone number and the password below.
                </p>
              </div>
            </div>

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
              onClick={handleCopyCredentials}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                copied
                  ? "bg-emerald-600 text-white"
                  : "bg-[#253C7D] text-white hover:bg-[#1d3066]"
              }`}
            >
              <i className={copied ? "ri-check-double-line text-sm" : "ri-file-copy-line text-sm"} />
              <span>{copied ? "Credentials Copied to Clipboard!" : "Copy Login Info to Share"}</span>
            </button>

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
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    <i className="ri-phone-fill text-gray-400 text-[10px]" />
                    <span className="font-semibold">{employee.phone || "No phone"}</span>
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                {employee.branches?.name || "Branch Staff"}
              </span>
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

            {/* Password Field */}
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
                  required
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

            {/* Confirm Password Field */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Confirm Password *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter the password"
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#253C7D]"
              />
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed bg-blue-50/60 p-2.5 rounded-lg border border-blue-100">
              💡 The user will use their phone number <strong>{employee.phone}</strong> and this password to log in. You can copy the credentials once created.
            </p>

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
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1d3066] rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-shield-keyhole-line text-sm" />
                    <span>Create Account & Password</span>
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
