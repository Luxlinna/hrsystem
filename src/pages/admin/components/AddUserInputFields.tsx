import type { AppRole, DirectoryEmployee, NewUserState } from "../types";
import { EmployeeAutofillSelect } from "./EmployeeAutofillSelect";

interface AddUserInputFieldsProps {
  accountType: "email" | "phone";
  newUser: NewUserState;
  setNewUser: React.Dispatch<React.SetStateAction<NewUserState>>;
  filteredEmployees: DirectoryEmployee[];
  selectedEmployeeEmail: string;
  selectedEmpObj: DirectoryEmployee | null | undefined;
  formBuRoles: AppRole[];
  formSiteRoles: AppRole[];
  formGlobalRoles: AppRole[];
  onSelectEmployee: (emp: DirectoryEmployee) => void;
  onClearSelection: () => void;
}

export function AddUserInputFields({
  accountType,
  newUser,
  setNewUser,
  filteredEmployees,
  selectedEmployeeEmail,
  selectedEmpObj,
  formBuRoles,
  formSiteRoles,
  formGlobalRoles,
  onSelectEmployee,
  onClearSelection,
}: AddUserInputFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <EmployeeAutofillSelect
        employees={filteredEmployees}
        selectedEmployeeEmail={selectedEmployeeEmail}
        accountType={accountType}
        onSelectEmployee={onSelectEmployee}
        onClearSelection={onClearSelection}
      />

      <div>
        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 block">
          {accountType === "email" ? "Email *" : "Phone Number *"}
        </label>
        <input
          value={(accountType === "email" ? newUser.email : newUser.phone) || ""}
          onChange={(e) =>
            setNewUser((p) =>
              accountType === "email" ? { ...p, email: e.target.value } : { ...p, phone: e.target.value }
            )
          }
          placeholder={accountType === "email" ? "user@company.com" : "012 345 678"}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-sky-500/20 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all h-[42px]"
        />
      </div>

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
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 block">Assign Role</label>
          {selectedEmpObj?.branch_name && (
            <span className="text-[10px] text-blue-600 dark:text-sky-400 font-semibold">
              Filtered: {selectedEmpObj.branch_name}
            </span>
          )}
        </div>
        <select
          value={newUser.role_id || ""}
          onChange={(e) => setNewUser((p) => ({ ...p, role_id: e.target.value }))}
          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-sky-500/20 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all cursor-pointer h-[42px]"
        >
          <option value="">No role (no access until assigned)</option>
          {formBuRoles.length > 0 && (
            <optgroup label={`${selectedEmpObj?.branch_name || "BU"} Roles`}>
              {formBuRoles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </optgroup>
          )}
          {formSiteRoles.length > 0 && (
            <optgroup label={`${selectedEmpObj?.site_name || "Site"} Roles`}>
              {formSiteRoles.map((r) => (
                <option key={r.id} value={r.id}>↳ {r.name} (Site)</option>
              ))}
            </optgroup>
          )}
          <optgroup label="Global Roles">
            {formGlobalRoles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </optgroup>
        </select>
      </div>
    </div>
  );
}
