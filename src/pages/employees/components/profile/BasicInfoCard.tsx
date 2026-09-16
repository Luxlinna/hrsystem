import { memo } from "react";
import type {
  Employee,
  ReportEntry,
  EmployeeFamilyMemberItem,
  EmployeeAchievementItem,
} from "../../types";
import { isPhoneSyntheticEmail } from "@/lib/phoneUtils";
import { formatBiometricId, extractMachinePin } from "@/lib/biometricUtils";

interface BasicInfoCardProps {
  employee: Employee;
  form: Partial<Employee>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  editing: boolean;
  saving: boolean;
  manager: ReportEntry | null;
  allEmployees: ReportEntry[];
  branches?: { id: string; name: string }[];
  workSites?: { id: string; name: string; branch_id: string }[];
  onSave: () => void;
}

export const BasicInfoCard = memo(function BasicInfoCard({
  employee,
  form,
  setForm,
  editing,
  saving,
  manager,
  allEmployees,
  branches = [],
  workSites = [],
  onSave,
}: BasicInfoCardProps) {
  const currentBranchId = form.branch_id || employee.branch_id;
  const availableSites = workSites.filter(
    (s) => !currentBranchId || s.branch_id === currentBranchId
  );

  const familyMembers: EmployeeFamilyMemberItem[] =
    (employee.family_members as EmployeeFamilyMemberItem[]) || [];

  const achievements: EmployeeAchievementItem[] =
    (employee.achievement_history as EmployeeAchievementItem[]) || [];

  const primaryId =
    employee.identifications?.[0] || {
      identification_type: "National ID Card",
      identification_number: employee.national_id_number || "—",
      expiration_date: "—",
    };

  const emergencyContact =
    employee.emergency_contacts?.[0] || {
      contact_person: employee.emergency_contact_name || "—",
      relationship: "Emergency Contact",
      phone_number: employee.emergency_phone_number || "—",
    };

  const fullAddress =
    [
      employee.permanent_address,
      employee.permanent_city,
      employee.permanent_province && employee.permanent_province !== employee.permanent_city
        ? employee.permanent_province
        : null,
      employee.permanent_postal_code,
      employee.permanent_country,
    ]
      .filter(Boolean)
      .join(", ") || (employee.permanent_address || "—");

  return (
    <div className="space-y-6">
      {/* 1. PERSONAL INFORMATION & IDENTITY */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#253C7D] flex items-center justify-center text-xl shadow-2xs">
              <i className="ri-user-smile-line" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                Personal Information &amp; Identity
              </h2>
              <p className="text-xs text-gray-500 font-medium">
                Official name records, gender, birth demographics, and citizenship status
              </p>
            </div>
          </div>
          {editing && (
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl hover:bg-[#1E3066] disabled:opacity-60 cursor-pointer shadow-xs active:scale-95 transition-all"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Title
            </label>
            {editing ? (
              <select
                value={form.title || "Mr"}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
              </select>
            ) : (
              <p className="text-xs text-gray-900 font-bold">{employee.title || "Mr"}</p>
            )}
          </div>

          {/* First Name */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              First Name
            </label>
            {editing ? (
              <input
                value={form.first_name || ""}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-gray-900 font-bold">{employee.first_name}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Last Name
            </label>
            {editing ? (
              <input
                value={form.last_name || ""}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-gray-900 font-bold">{employee.last_name}</p>
            )}
          </div>

          {/* Khmer Name */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Khmer Name (ឈ្មោះជាភាសាខ្មែរ)
            </label>
            {editing ? (
              <input
                value={form.kh_name || ""}
                onChange={(e) => setForm({ ...form, kh_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-[#253C7D] font-bold font-sans">
                {employee.kh_name || "—"}
              </p>
            )}
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Display Name
            </label>
            {editing ? (
              <input
                value={form.display_name || ""}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-gray-900 font-bold">{employee.display_name || "—"}</p>
            )}
          </div>

          {/* Foreign Name */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Foreign / Latin Name
            </label>
            {editing ? (
              <input
                value={form.foreign_name || ""}
                onChange={(e) => setForm({ ...form, foreign_name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-gray-900 font-bold">{employee.foreign_name || "—"}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Gender
            </label>
            {editing ? (
              <select
                value={form.gender || "Male"}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            ) : (
              <p className="text-xs text-gray-900 font-bold">{employee.gender || "—"}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Date of Birth
            </label>
            {editing ? (
              <input
                type="date"
                value={form.date_of_birth || ""}
                onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-gray-900 font-mono font-bold">
                {employee.date_of_birth || "—"}
              </p>
            )}
          </div>

          {/* Marital Status */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Marital Status
            </label>
            {editing ? (
              <select
                value={form.marital_status || "Single"}
                onChange={(e) => setForm({ ...form, marital_status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            ) : (
              <p className="text-xs text-gray-900 font-bold">{employee.marital_status || "Single"}</p>
            )}
          </div>

          {/* Nationality */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Nationality
            </label>
            <p className="text-xs text-gray-900 font-bold">{employee.nationality || "Khmer"}</p>
          </div>

          {/* Religion */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Religion
            </label>
            <p className="text-xs text-gray-900 font-bold">{employee.religion || "None"}</p>
          </div>

          {/* Blood Group */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Blood Group
            </label>
            <p className="text-xs text-gray-900 font-bold">{employee.blood_group || "None"}</p>
          </div>

          {/* Resident Status */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Resident Status
            </label>
            <span
              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                employee.is_resident !== false
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-amber-50 text-amber-700 border border-amber-200"
              }`}
            >
              {employee.is_resident !== false ? "Resident Taxpayer" : "Non-Resident"}
            </span>
          </div>

          {/* Fringe Benefit */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Fringe Benefit
            </label>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              {employee.fringe_benefit ? "Eligible" : "None"}
            </span>
          </div>
        </div>
      </div>

      {/* 2. OFFICIAL IDENTIFICATION & TAX IDENTIFICATION */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-lg shadow-2xs">
            <i className="ri-id-card-line" />
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">
              Official Identification &amp; Tax Credentials
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              National ID records, staff identifier, biometric credentials, and tax filings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Primary ID */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              {primaryId.identification_type || "National ID"}
            </span>
            <p className="text-xs font-mono font-black text-slate-900">
              {primaryId.identification_number || employee.national_id_number || "—"}
            </p>
            {primaryId.expiration_date && primaryId.expiration_date !== "—" && (
              <p className="text-[10px] text-slate-500 mt-1">Exp: {primaryId.expiration_date}</p>
            )}
          </div>

          {/* Staff ID / Employee Code */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Staff ID / Employee Code
            </span>
            <p className="text-xs font-mono font-black text-[#253C7D]">
              {employee.employee_code || "006"}
            </p>
            <span className="inline-block text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 mt-1">
              System ID
            </span>
          </div>

          {/* Biometric Terminal Machine PIN */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Biometric PIN / Machine ID
            </span>
            <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-slate-900">
              <i className="ri-fingerprint-line text-slate-500" />
              <span>{employee.biometric_user_id || "Not Linked"}</span>
            </div>
            {employee.biometric_user_id && (
              <p className="text-[10px] text-indigo-600 font-mono mt-1 font-semibold">
                Terminal: {extractMachinePin(employee.biometric_user_id)}
              </p>
            )}
          </div>

          {/* Tax Number / Method */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Tax Method / TIN
            </span>
            <p className="text-xs font-bold text-slate-900 font-mono">
              {employee.employee_tax_number || employee.tax_method || "Resident"}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">General Department of Taxation</p>
          </div>
        </div>
      </div>

      {/* 3. CONTACT & RESIDENTIAL ADDRESSES */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-lg shadow-2xs">
            <i className="ri-map-pin-user-line" />
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">
              Contact Channels &amp; Residential Addresses
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              Registered living addresses, primary telecommunications, and next-of-kin emergency contact
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Work Email */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Primary Email
            </label>
            {editing ? (
              <input
                type="email"
                value={isPhoneSyntheticEmail(form.email) ? "" : form.email || ""}
                placeholder="Email address"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-gray-900 font-bold truncate">
                {employee.email && !isPhoneSyntheticEmail(employee.email) ? employee.email : "—"}
              </p>
            )}
          </div>

          {/* Primary Phone */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Primary Mobile Phone
            </label>
            {editing ? (
              <input
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-gray-900 font-bold font-mono">{employee.phone || "—"}</p>
            )}
          </div>

          {/* Home / Alternative Phone */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Home Phone / Telegram
            </label>
            {editing ? (
              <input
                value={form.home_phone || ""}
                onChange={(e) => setForm({ ...form, home_phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-gray-900 font-bold font-mono">{employee.home_phone || "—"}</p>
            )}
          </div>

          {/* Permanent Address */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Permanent Registered Address
            </label>
            {editing ? (
              <input
                value={form.permanent_address || ""}
                onChange={(e) => setForm({ ...form, permanent_address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <i className="ri-home-4-line text-[#253C7D] mr-1.5" />
                {fullAddress}
              </p>
            )}
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Emergency Contact (Next-of-Kin)
            </label>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-0.5">
              <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                <i className="ri-contacts-line text-rose-500 text-xs" />
                <span>{emergencyContact.contact_person}</span>
                {emergencyContact.relationship && (
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({emergencyContact.relationship})
                  </span>
                )}
              </p>
              <p className="text-xs font-mono font-bold text-slate-700">
                {emergencyContact.phone_number}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. ORGANIZATIONAL HIERARCHY & EMPLOYMENT TERMS (STEP 2) */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-lg shadow-2xs">
            <i className="ri-building-line" />
          </div>
          <div>
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide">
              Organizational Hierarchy &amp; Hiring Terms (Step 2)
            </h3>
            <p className="text-[11px] text-gray-500 font-medium">
              Assigned Business Unit (BU), contract duration, working schedule, and reporting structure
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Business Unit (BU) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Business Unit (BU)
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-[#253C7D]">
                {employee.bu_full_name || employee.branches?.name || "OPS sulotion"}
              </span>
              {employee.code_bu && (
                <span className="text-[10px] font-mono font-black px-1.5 py-0.2 rounded bg-blue-100 text-[#253C7D]">
                  [{employee.code_bu}]
                </span>
              )}
              {employee.handle_bu && (
                <span className="text-[10px] text-slate-400 font-mono">{employee.handle_bu}</span>
              )}
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Department
            </label>
            {editing ? (
              <input
                value={form.department || ""}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-gray-900 font-bold">{employee.department || "IT"}</p>
            )}
          </div>

          {/* Position / Role */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Position &amp; Role
            </label>
            {editing ? (
              <input
                value={form.position || form.role || ""}
                onChange={(e) =>
                  setForm({ ...form, position: e.target.value, role: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              />
            ) : (
              <p className="text-xs text-gray-900 font-bold">{employee.position || employee.role}</p>
            )}
          </div>

          {/* Direct Line Manager */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Line Manager (Reporting Line)
            </label>
            {editing ? (
              <select
                value={form.reports_to || ""}
                onChange={(e) => setForm({ ...form, reports_to: e.target.value || null })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold focus:outline-none focus:border-[#253C7D]"
              >
                <option value="">No manager</option>
                {allEmployees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.first_name} {e.last_name} — {e.role}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-1.5">
                <i className="ri-user-star-line text-[#253C7D] text-xs" />
                <span className="text-xs font-bold text-slate-900">
                  {manager
                    ? `${manager.first_name} ${manager.last_name} (${manager.role})`
                    : employee.line_manager || "No manager"}
                </span>
              </div>
            )}
          </div>

          {/* Contract Type & Duration */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Contract Type &amp; Duration
            </label>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-blue-50 text-[#253C7D] border border-blue-200 text-xs font-bold">
                {employee.contract_type || "Internship"}
              </span>
              {employee.contract_remark && (
                <span className="text-xs text-slate-500 font-medium">
                  ({employee.contract_remark})
                </span>
              )}
            </div>
          </div>

          {/* Contract Dates */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Contract Duration Window
            </label>
            <p className="text-xs text-slate-800 font-mono font-bold">
              {employee.contract_effective_date || employee.start_date || employee.join_date || "—"}{" "}
              to {employee.contract_end_date || employee.fdc_end_date || "—"}
            </p>
          </div>

          {/* Working Hours */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Working Hours
            </label>
            <p className="text-xs text-slate-800 font-medium">
              {employee.working_hour || "8:00 AM - 5:00 PM (44 hrs/wk)"}
            </p>
          </div>

          {/* Total Working Days */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Working Schedule
            </label>
            <p className="text-xs text-slate-800 font-medium">
              {employee.total_working_days || "5.5 Days/Week (Mon - Sat Noon)"}
            </p>
          </div>

          {/* Working Location / Site */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
              Work Location / Site
            </label>
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
              <i className="ri-map-pin-2-line text-emerald-600" />
              <span>
                {employee.site ||
                  employee.working_location ||
                  employee.work_locations?.name ||
                  employee.branches?.name ||
                  "Phnom Penh"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. FAMILY MEMBERS SECTION */}
      {familyMembers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <i className="ri-parent-line text-[#253C7D]" />
              <span>Registered Family Members ({familyMembers.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Declared for tax filing and emergency dependency records
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Member Name</th>
                  <th className="py-2.5 px-3">Relationship</th>
                  <th className="py-2.5 px-3">Gender</th>
                  <th className="py-2.5 px-3">Date of Birth</th>
                  <th className="py-2.5 px-3">Nationality</th>
                  <th className="py-2.5 px-3 text-center">Tax Filing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {familyMembers.map((fam, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-900">{fam.name}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-semibold">{fam.relationship}</td>
                    <td className="py-2.5 px-3 text-slate-600">{fam.gender}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono">
                      {fam.date_of_birth || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{fam.nationality || "Khmer"}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          fam.tax_filing
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {fam.tax_filing ? "Claimed" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. ACHIEVEMENTS & RECOGNITION SECTION */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <i className="ri-award-line text-amber-500" />
              <span>Honors, Awards &amp; Recognized Achievements</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              {achievements.length} recorded honor{achievements.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {achievements.map((ach, idx) => (
              <div
                key={idx}
                className="p-4 border border-amber-200/80 rounded-xl bg-amber-50/20 hover:bg-amber-50/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">{ach.title}</span>
                    {ach.year_awarded && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        {ach.year_awarded}
                      </span>
                    )}
                  </div>
                  {ach.program_name && (
                    <p className="text-xs text-[#253C7D] font-bold mt-1">{ach.program_name}</p>
                  )}
                  {ach.organizer_name && (
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Organizer: {ach.organizer_name} {ach.country ? `· ${ach.country}` : ""}
                    </p>
                  )}
                  {ach.remark && (
                    <p className="text-[11px] text-slate-600 italic mt-1.5">{ach.remark}</p>
                  )}
                </div>

                {ach.attachment && (
                  <div className="pt-2 mt-2 border-t border-amber-100">
                    <a
                      href={ach.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-[#253C7D] hover:underline inline-flex items-center gap-1"
                    >
                      <i className="ri-attachment-line text-sm" />
                      <span>View Certificate / Evidence &rarr;</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
