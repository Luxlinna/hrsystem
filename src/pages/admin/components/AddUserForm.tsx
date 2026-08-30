import { memo } from "react";
import type { AppRole, DirectoryEmployee, NewUserState } from "../types";
import { EmployeeAutofillSelect } from "./EmployeeAutofillSelect";

interface AddUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  newUser: NewUserState;
  setNewUser: React.Dispatch<React.SetStateAction<NewUserState>>;
  selectedEmployeeEmail: string;
  setSelectedEmployeeEmail: (email: string) => void;
  employees: DirectoryEmployee[];
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
  roles,
  savingUser,
  onSaveUser,
}: AddUserFormProps) {
  if (!isOpen) return null;

  const handleSelectEmployee = (emp: DirectoryEmployee) => {
    setSelectedEmployeeEmail(emp.email);
    const matchingRole = roles.find(
      (role) => role.name.trim().toLowerCase() === (emp.role || "").trim().toLowerCase()
    );

    setNewUser((p) => ({
      ...p,
      email: emp.email,
      display_name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || p.display_name,
      role_id: matchingRole ? String(matchingRole.id) : p.role_id,
    }));
  };

  const handleClearSelection = () => {
    setSelectedEmployeeEmail("");
    setNewUser((p) => ({ ...p, email: "", display_name: "", role_id: "" }));
  };

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

      {/* Invitation Checkbox */}
      <div className="flex items-center gap-3 p-3 bg-white/90 border border-gray-200/90 rounded-xl shadow-2xs">
        <input
          type="checkbox"
          id="sendInvite"
          checked={newUser.sendInvite}
          onChange={(e) => setNewUser((p) => ({ ...p, sendInvite: e.target.checked }))}
          className="w-4 h-4 rounded cursor-pointer accent-[#253C7D]"
        />
        <label htmlFor="sendInvite" className="text-xs font-medium text-gray-800 cursor-pointer select-none">
          Send email invitation <span className="text-[11px] text-gray-500 font-normal">(creates Auth account &amp; dispatches setup email via Gmail)</span>
        </label>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <EmployeeAutofillSelect
          employees={employees}
          selectedEmployeeEmail={selectedEmployeeEmail}
          onSelectEmployee={handleSelectEmployee}
          onClearSelection={handleClearSelection}
        />

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Email *</label>
          <input
            value={newUser.email}
            onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
            placeholder="user@company.com"
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all h-[42px]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Display Name</label>
          <input
            value={newUser.display_name}
            onChange={(e) => setNewUser((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="Full Name"
            className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all h-[42px]"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1.5 block">Assign Role</label>
          <select
            value={newUser.role_id}
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
          disabled={savingUser || !newUser.email.trim()}
          className="px-5 py-2 text-xs font-semibold text-white bg-[#253C7D] hover:bg-[#1F336A] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {savingUser ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <i className="ri-check-line text-sm" />
              <span>{newUser.sendInvite ? "Send Invite & Save" : "Save User"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
});
