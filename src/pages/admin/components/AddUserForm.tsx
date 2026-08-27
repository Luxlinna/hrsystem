import React, { memo } from "react";
import type { AppRole, DirectoryEmployee, NewUserState } from "../types";

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

  return (
    <div className="bg-[#253C7D]/5 border border-[#253C7D]/20 rounded-xl p-5">
      <h4 className="text-sm font-bold text-gray-900 mb-4">Add User</h4>
      <div className="flex items-center gap-3 mb-4 p-3 bg-white border border-gray-200 rounded-xl">
        <input
          type="checkbox"
          id="sendInvite"
          checked={newUser.sendInvite}
          onChange={(e) => setNewUser((p) => ({ ...p, sendInvite: e.target.checked }))}
          className="w-4 h-4 rounded cursor-pointer accent-[#253C7D]"
        />
        <label htmlFor="sendInvite" className="text-sm font-medium text-gray-800 cursor-pointer">
          Send email invitation <span className="text-xs text-gray-400 font-normal">(creates auth account + sends setup link via Gmail)</span>
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Select Employee (Optional)</label>
          <select
            onChange={(e) => {
              setSelectedEmployeeEmail(e.target.value);
              const selected = employees.find((emp) => emp.email === e.target.value);
              if (selected) {
                const matchingRole = roles.find(
                  (role) => role.name.trim().toLocaleLowerCase() === selected.role?.trim().toLocaleLowerCase()
                );
                setNewUser((p) => ({
                  ...p,
                  email: selected.email,
                  display_name: `${selected.first_name || ""} ${selected.last_name || ""}`.trim() || p.display_name,
                  role_id: matchingRole ? String(matchingRole.id) : "",
                }));
              }
            }}
            value={selectedEmployeeEmail}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
          >
            <option value="">-- Quick autofill from Employee --</option>
            {employees.map((emp) => (
              <option key={emp.email} value={emp.email}>
                {`${emp.first_name || ""} ${emp.last_name || ""}`.trim()} — {emp.role || "No directory role"} ({emp.email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Email *</label>
          <input
            value={newUser.email}
            onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))}
            placeholder="user@company.com"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Display Name</label>
          <input
            value={newUser.display_name}
            onChange={(e) => setNewUser((p) => ({ ...p, display_name: e.target.value }))}
            placeholder="Full name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Assign Role</label>
          <select
            value={newUser.role_id}
            onChange={(e) => setNewUser((p) => ({ ...p, role_id: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
          >
            <option value="">No role (no access until assigned)</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => { onClose(); setSelectedEmployeeEmail(""); }}
          className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={onSaveUser}
          disabled={savingUser}
          className="flex items-center gap-2 px-5 py-2 bg-[#253C7D] text-white rounded-lg text-sm hover:bg-[#1F336A] disabled:opacity-60 cursor-pointer whitespace-nowrap"
        >
          {savingUser ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <i className={newUser.sendInvite ? "ri-mail-send-line" : "ri-user-add-line"} />
          )}
          {newUser.sendInvite ? "Send Invite" : "Add User"}
        </button>
      </div>
    </div>
  );
});
