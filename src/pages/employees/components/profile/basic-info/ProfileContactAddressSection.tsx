import { memo } from "react";
import type { BasicInfoSectionProps } from "./types";
import { isPhoneSyntheticEmail } from "@/lib/phoneUtils";
import { ProfileEmergencyContactFields } from "./ProfileEmergencyContactFields";

export const ProfileContactAddressSection = memo(function ProfileContactAddressSection({
  employee,
  form,
  setForm,
  editing,
}: BasicInfoSectionProps) {
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

        {/* Home Phone */}
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
            <div className="space-y-2">
              <input
                placeholder="Street / Village / Sangkat address"
                value={form.permanent_address || ""}
                onChange={(e) => setForm({ ...form, permanent_address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-[#253C7D]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  placeholder="City / Khan"
                  value={form.permanent_city || ""}
                  onChange={(e) => setForm({ ...form, permanent_city: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#253C7D]"
                />
                <input
                  placeholder="Province"
                  value={form.permanent_province || ""}
                  onChange={(e) => setForm({ ...form, permanent_province: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <i className="ri-home-4-line text-[#253C7D] mr-1.5" />
              {fullAddress}
            </p>
          )}
        </div>

        {/* Emergency Contact */}
        <ProfileEmergencyContactFields
          employee={employee}
          form={form}
          setForm={setForm}
          editing={editing}
        />
      </div>
    </div>
  );
});
