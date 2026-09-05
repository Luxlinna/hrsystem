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
        return cleanDigits.length >= 6;
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
    (accountType === "phone" && (!newUser.phone?.trim() || (newUser.password || "").length < 6));

  return (
    <div className="bg-gradient-to-b from-[#253C7D]/8 to-white border border-[#253C7D]/20 rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#253C7D]/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#253C7D] text-white flex items-center justify-center text-base shadow-xs">
            <i className="ri-user-add-line" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">Provision User Account</h4>
            <p className="text-xs text-gray-500">Pick an employee from directory for instant autofill, or enter account details manually.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-lg" />
        </button>
      </div>

      {/* Account Type Selector & Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/90 border border-gray-200/90 rounded-xl shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700">Account Type:</span>
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => handleSwitchAccountType("email")}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                accountType === "email"
                  ? "bg-white text-[#253C7D] shadow-xs font-bold"
                  : "text-gray-500 hover:text-gray-800"
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
                  ? "bg-white text-[#253C7D] shadow-xs font-bold"
                  : "text-gray-500 hover:text-gray-800"
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
            <span className="text-xs text-gray-700 font-medium">Send setup link via Gmail</span>
          </label>
        ) : (
          <span className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
            <i className="ri-key-2-line text-amber-600" />
            Admin creates password for phone login
          </span>
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
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Email *</label>
            <input
              value={newUser.email || ""}
              onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
              placeholder="user@company.com"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all h-[42px]"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Phone Number *</label>
            <input
              value={newUser.phone || ""}
              onChange={(e) => setNewUser((p) => ({ ...p, phone: e.target.value }))}
              placeholder="012 345 678"
              className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all h-[42px]"
            />
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Display Name</label>
          <input
            value={newUser.display_name || ""}
            onChange={(e) => setNewUser((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="Full Name"
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all h-[42px]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Assign Role</label>
          <select
            value={newUser.role_id || ""}
            onChange={(e) => setNewUser((p) => ({ ...p, role_id: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all cursor-pointer h-[42px]"
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

      {/* Password field for Phone accounts */}
      {accountType === "phone" && (
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-800">Initial Password *</label>
            <button
              type="button"
              onClick={generateRandomPassword}
              className="text-[11px] font-bold text-[#253C7D] hover:underline flex items-center gap-1 cursor-pointer"
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
              className="w-full pl-3.5 pr-10 py-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className={showPassword ? "ri-eye-off-line text-sm" : "ri-eye-line text-sm"} />
            </button>
          </div>
          <p className="text-[11px] text-gray-500">
            Share this password with the staff member. They will sign in using their phone number{" "}
            <strong>{newUser.phone || "..."}</strong> and this password.
          </p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
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
            <>
              <i className="ri-shield-keyhole-line text-sm" />
              <span>Create Phone Account</span>
            </>
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
