import { memo, useState, useMemo } from "react";
import type { AppRole, DirectoryEmployee, NewUserState } from "../types";
import { EmployeeAutofillSelect } from "./EmployeeAutofillSelect";
import { isPhoneSyntheticEmail } from "@/lib/phoneUtils";

interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
}

interface AddUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  newUser: NewUserState;
  setNewUser: React.Dispatch<React.SetStateAction<NewUserState>>;
  selectedEmployeeEmail: string;
  setSelectedEmployeeEmail: (email: string) => void;
  employees: DirectoryEmployee[];
  branches?: BranchOption[];
  filterBranch?: string;
  roles: AppRole[];
  savingUser: boolean;
  onSaveUser: () => void;
}

export const AddUserForm = memo(function AddUserForm({
  isOpen,
  onClose,
  newUser,
  setNewUser,
  selectedEmployeeEmail,
  setSelectedEmployeeEmail,
  employees,
  branches = [],
  filterBranch = "all",
  roles,
  savingUser,
  onSaveUser,
}: AddUserFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const accountType = newUser.accountType || (newUser.phone && !newUser.email ? "phone" : "email");

  // Filter employees: only valid phone or email, and strictly belonging to the active branch / sites
  const filteredEmployeesForAutofill = useMemo(() => {
    let list = employees || [];

    // 1. Filter by valid contact info according to the selected accountType
    if (accountType === "phone") {
      list = list.filter((emp) => {
        if (!emp.phone || typeof emp.phone !== "string") return false;
        const cleanDigits = emp.phone.replace(/\D/g, "");
        if (cleanDigits.length < 6) return false;
        // Reject dummy test numbers
        if (cleanDigits === "0987654321" || cleanDigits === "987654321" || cleanDigits === "123456789") return false;
        return true;
      });
    } else {
      list = list.filter((emp) => {
        if (!emp.email || typeof emp.email !== "string") return false;
        const clean = emp.email.trim().toLowerCase();
        return clean.includes("@") && !isPhoneSyntheticEmail(clean);
      });
    }

    // 2. Filter by branch and branch sites
    if (branches && branches.length > 0) {
      if (filterBranch && filterBranch.startsWith("site:")) {
        const targetSiteId = filterBranch.substring(5);
        list = list.filter((emp) => emp.default_work_location_id === targetSiteId);
      } else if (filterBranch && filterBranch !== "all") {
        const targetBranch = branches.find((b) => b.id === filterBranch && !b.is_site);
        const targetName = (targetBranch?.name || "").toLowerCase().trim();

        list = list.filter((emp) => {
          const empBranchName = (emp.branch_name || "").toLowerCase().trim();
          const isDirect = emp.branch_id === filterBranch;
          const isNameMatch = Boolean(targetName && empBranchName && empBranchName === targetName);
          const isSiteMatch = Boolean(
            emp.default_work_location_id &&
            branches.some(
              (b) =>
                b.is_site &&
                b.branch_id === filterBranch &&
                b.id === `site:${emp.default_work_location_id}`
            )
          );
          return isDirect || isNameMatch || isSiteMatch;
        });
      } else {
        // When filterBranch is "all", check if the branches list itself is scoped to one parent branch
        const pureBranches = branches.filter((b) => !b.is_site);
        if (pureBranches.length === 1) {
          const parentBranch = pureBranches[0];
          const parentName = (parentBranch.name || "").toLowerCase().trim();
          list = list.filter((emp) => {
            const empBranchName = (emp.branch_name || "").toLowerCase().trim();
            const isDirect = emp.branch_id === parentBranch.id;
            const isNameMatch = Boolean(parentName && empBranchName && empBranchName === parentName);
            const isSiteMatch = Boolean(
              emp.default_work_location_id &&
              branches.some(
                (b) =>
                  b.is_site &&
                  b.branch_id === parentBranch.id &&
                  b.id === `site:${emp.default_work_location_id}`
              )
            );
            return isDirect || isNameMatch || isSiteMatch;
          });
        }
      }
    }

    return list;
  }, [employees, accountType, branches, filterBranch]);

  const handleSelectEmployee = (emp: DirectoryEmployee) => {
    setSelectedEmployeeEmail(emp.email || emp.phone || emp.id);
    const matchingRole = roles.find(
      (role) => role.name.trim().toLowerCase() === (emp.role || "").trim().toLowerCase()
    );

    setNewUser((p) => {
      const activeType = p.accountType || (p.phone && !p.email ? "phone" : "email");
      return {
        ...p,
        accountType: activeType,
        email: activeType === "email" ? (emp.email || "") : (p.email || ""),
        phone: activeType === "phone" ? (emp.phone || "") : (p.phone || ""),
        employee_id: emp.id,
        display_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || p.display_name,
        role_id: matchingRole ? String(matchingRole.id) : p.role_id,
      };
    });
  };

  const handleClearSelection = () => {
    setSelectedEmployeeEmail("");
    setNewUser((p) => ({
      ...p,
      email: "",
      phone: "",
      password: "",
      employee_id: undefined,
      display_name: "",
      role_id: "",
    }));
  };

  const handleSwitchAccountType = (type: "email" | "phone") => {
    setNewUser((p) => {
      let updatedEmail = p.email;
      let updatedPhone = p.phone;
      let updatedEmpId = p.employee_id;
      let updatedDisplayName = p.display_name;

      if (type === "phone") {
        if (!p.phone || p.phone.replace(/\D/g, "").length < 6) {
          const emp = employees.find((e) => e.id === p.employee_id);
          if (emp?.phone && emp.phone.replace(/\D/g, "").length >= 6) {
            updatedPhone = emp.phone;
          } else {
            updatedPhone = "";
            updatedEmpId = undefined;
            setSelectedEmployeeEmail("");
          }
        }
      } else {
        if (!p.email || !p.email.includes("@") || isPhoneSyntheticEmail(p.email)) {
          const emp = employees.find((e) => e.id === p.employee_id);
          if (emp?.email && emp.email.includes("@") && !isPhoneSyntheticEmail(emp.email)) {
            updatedEmail = emp.email;
          } else {
            updatedEmail = "";
            updatedEmpId = undefined;
            setSelectedEmployeeEmail("");
          }
        }
      }

      return {
        ...p,
        accountType: type,
        email: updatedEmail,
        phone: updatedPhone,
        employee_id: updatedEmpId,
        display_name: updatedDisplayName,
      };
    });
  };

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
    let rand = "";
    for (let i = 0; i < 8; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `Staff#${rand}`;
    setNewUser((p) => ({ ...p, password: generated }));
    setShowPassword(true);
  };

  if (!isOpen) return null;

  const isSubmitDisabled =
    savingUser ||
    (accountType === "email" && !newUser.email?.trim()) ||
    (accountType === "phone" &&
      (!newUser.phone?.trim() || (!newUser.sendInvite && (newUser.password || "").length < 6)));

  return (
    <div className="bg-gradient-to-b from-[#253C7D]/8 to-white dark:from-[#253C7D]/20 dark:to-slate-900 border border-[#253C7D]/20 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#253C7D]/10 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#253C7D] text-white flex items-center justify-center text-base shadow-xs">
            <i className="ri-user-add-line" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">Provision User Account</h4>
            <p className="text-xs text-gray-500 dark:text-slate-400">Pick an employee from directory for instant autofill, or enter account details manually.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-lg" />
        </button>
      </div>

      {/* Account Type Selector & Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/90 dark:bg-slate-800/80 border border-gray-200/90 dark:border-slate-700 rounded-xl shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Account Type:</span>
          <div className="flex items-center bg-gray-100 dark:bg-slate-700 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => handleSwitchAccountType("email")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                accountType === "email"
                  ? "bg-white dark:bg-slate-800 text-[#253C7D] dark:text-sky-300 shadow-xs font-bold"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
              }`}
            >
              <i className="ri-mail-line text-xs" />
              <span>Email Account</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchAccountType("phone")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                accountType === "phone"
                  ? "bg-white dark:bg-slate-800 text-[#253C7D] dark:text-sky-300 shadow-xs font-bold"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
              }`}
            >
              <i className="ri-phone-line text-xs" />
              <span>Phone Number Account</span>
            </button>
          </div>
        </div>

        {accountType === "email" ? (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              id="sendInvite"
              checked={newUser.sendInvite}
              onChange={(e) => setNewUser((p) => ({ ...p, sendInvite: e.target.checked }))}
              className="w-4 h-4 rounded cursor-pointer accent-[#253C7D]"
            />
            <span className="text-xs text-gray-700 dark:text-slate-300 font-medium">Send setup link via Gmail</span>
          </label>
        ) : (
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="radio"
                name="phoneAccountMode"
                checked={newUser.sendInvite}
                onChange={() => setNewUser((p) => ({ ...p, sendInvite: true }))}
                className="w-3.5 h-3.5 cursor-pointer accent-[#229ED9]"
              />
              <span className="text-xs text-gray-800 dark:text-slate-200 font-semibold flex items-center gap-1">
                <i className="ri-telegram-fill text-[#229ED9] text-sm" />
                Invite via Telegram
              </span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="radio"
                name="phoneAccountMode"
                checked={!newUser.sendInvite}
                onChange={() => setNewUser((p) => ({ ...p, sendInvite: false }))}
                className="w-3.5 h-3.5 cursor-pointer accent-[#253C7D]"
              />
              <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">Set password manually</span>
            </label>
          </div>
        )}
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <EmployeeAutofillSelect
          employees={filteredEmployeesForAutofill}
          selectedEmployeeEmail={selectedEmployeeEmail}
          accountType={accountType}
          onSelectEmployee={handleSelectEmployee}
          onClearSelection={handleClearSelection}
        />

        {accountType === "email" ? (
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 block">Email *</label>
            <input
              value={newUser.email || ""}
              onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
              placeholder="user@company.com"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-sky-500/20 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all h-[42px]"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 block">Phone Number *</label>
            <input
              value={newUser.phone || ""}
              onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))}
              placeholder="012 345 678"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-sky-500/20 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all h-[42px]"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 block">Display Name</label>
          <input
            value={newUser.display_name || ""}
            onChange={(e) => setNewUser((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="Full Name"
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-sky-500/20 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all h-[42px]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 block">Assign Role</label>
          <select
            value={newUser.role_id || ""}
            onChange={(e) => setNewUser((p) => ({ ...p, role_id: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-sky-500/20 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all cursor-pointer h-[42px]"
          >
            <option value="">No role (no access until assigned)</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Password field or Telegram Invite Banner for Phone accounts */}
      {accountType === "phone" && (
        newUser.sendInvite ? (
          <div className="p-4 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-950 dark:text-sky-200">
              <i className="ri-telegram-fill text-[#229ED9] text-base" />
              <span>1-Click Telegram Setup Link</span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-transparent dark:border-emerald-800/50">
                Free $0.00
              </span>
            </div>
            <p className="text-[11px] text-sky-900 dark:text-sky-300 leading-relaxed">
              A secure 24-hour setup link will be generated. You can share it directly to{" "}
              <strong>{newUser.phone || "the employee"}</strong> on Telegram in 1 click so they can create their own password safely.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-blue-50/50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-800 dark:text-slate-200">Initial Password *</label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] font-bold text-[#253C7D] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <i className="ri-magic-line text-xs" />
                <span>Auto-Generate</span>
              </button>
            </div>
            <div className="relative max-w-md">
              <input
                type={showPassword ? "text" : "password"}
                value={newUser.password || ""}
                onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
                placeholder="Minimum 6 characters"
                className="w-full pl-3.5 pr-10 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-sky-500/20 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <i className={showPassword ? "ri-eye-off-line text-sm" : "ri-eye-line text-sm"} />
              </button>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400">
              Share this password with the staff member. They will sign in using their phone number{" "}
              <strong>{newUser.phone || "..."}</strong> and this password.
            </p>
          </div>
        )
      )}

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSaveUser}
          disabled={isSubmitDisabled}
          className="px-5 py-2 text-xs font-semibold text-white bg-[#253C7D] hover:bg-[#1F336A] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {savingUser ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : accountType === "phone" ? (
            newUser.sendInvite ? (
              <>
                <i className="ri-telegram-fill text-sm" />
                <span>Invite via Telegram</span>
              </>
            ) : (
              <>
                <i className="ri-shield-keyhole-line text-sm" />
                <span>Create Phone Account</span>
              </>
            )
          ) : newUser.sendInvite ? (
            <>
              <i className="ri-check-line text-sm" />
              <span>Send Invite &amp; Save</span>
            </>
          ) : (
            <>
              <i className="ri-check-line text-sm" />
              <span>Save User</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});
