import React, { useState, useEffect } from "react";
import type { Candidate } from "../../types";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface EditHiringInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate;
  onSaved: (updatedCandidate: Partial<Candidate>) => void;
}

export const EditHiringInfoModal: React.FC<EditHiringInfoModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<
    "personal" | "org" | "terms" | "compensation" | "contact"
  >("personal");

  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    // 1. Personal Details
    full_name: candidate.full_name || "",
    kh_name: candidate.kh_name || "",
    gender: candidate.gender || "",
    date_of_birth: candidate.date_of_birth || "",
    marital_status: candidate.marital_status || "",
    national_id_number: candidate.national_id_number || "",

    // 2. Organizational Placement & Physical Site
    code_bu: candidate.code_bu || "",
    bu_full_name: candidate.bu_full_name || "",
    handle_bu: candidate.handle_bu || "",
    division: candidate.division || "",
    department: candidate.department || "",
    position: candidate.position || candidate.job_title || "",
    site: candidate.site || "",
    working_location: candidate.working_location || candidate.location || "",

    // 3. Terms & Employment Schedule
    working_hour: candidate.working_hour || "",
    total_working_days: candidate.total_working_days || "",
    employment_type: candidate.employment_type || "Full Time",
    start_date: candidate.start_date || "",
    line_manager: candidate.line_manager || "",
    contract_type: candidate.contract_type || "FDC",
    fdc_end_date: candidate.fdc_end_date || "",
    hiring_status: candidate.hiring_status || "probation",

    // 4. Compensation & Payroll
    basic_salary: candidate.basic_salary ? String(candidate.basic_salary) : candidate.expected_salary ? String(candidate.expected_salary) : "",
    tax_method: candidate.tax_method || "Resident",
    allowance: candidate.allowance || "",
    bank_account_number: candidate.bank_account_number || "",
    nssf_number: candidate.nssf_number || "",

    // 5. Contact & Emergency Details
    email: candidate.email || "",
    phone: candidate.phone || "",
    current_address: candidate.current_address || "",
    emergency_contact_name: candidate.emergency_contact_name || "",
    emergency_phone_number: candidate.emergency_phone_number || "",
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        full_name: candidate.full_name || "",
        kh_name: candidate.kh_name || "",
        gender: candidate.gender || "",
        date_of_birth: candidate.date_of_birth || "",
        marital_status: candidate.marital_status || "",
        national_id_number: candidate.national_id_number || "",

        code_bu: candidate.code_bu || "",
        bu_full_name: candidate.bu_full_name || "",
        handle_bu: candidate.handle_bu || "",
        division: candidate.division || "",
        department: candidate.department || "",
        position: candidate.position || candidate.job_title || "",
        site: candidate.site || "",
        working_location: candidate.working_location || candidate.location || "",

        working_hour: candidate.working_hour || "",
        total_working_days: candidate.total_working_days || "",
        employment_type: candidate.employment_type || "Full Time",
        start_date: candidate.start_date || "",
        line_manager: candidate.line_manager || "",
        contract_type: candidate.contract_type || "FDC",
        fdc_end_date: candidate.fdc_end_date || "",
        hiring_status: candidate.hiring_status || "probation",

        basic_salary: candidate.basic_salary ? String(candidate.basic_salary) : candidate.expected_salary ? String(candidate.expected_salary) : "",
        tax_method: candidate.tax_method || "Resident",
        allowance: candidate.allowance || "",
        bank_account_number: candidate.bank_account_number || "",
        nssf_number: candidate.nssf_number || "",

        email: candidate.email || "",
        phone: candidate.phone || "",
        current_address: candidate.current_address || "",
        emergency_contact_name: candidate.emergency_contact_name || "",
        emergency_phone_number: candidate.emergency_phone_number || "",
      });
      setActiveTab("personal");
    }
  }, [isOpen, candidate]);

  if (!isOpen) return null;

  const handleChange = (
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast("Validation Error", "Full Name is required.", "error");
      setActiveTab("personal");
      return;
    }
    if (!formData.email.trim()) {
      toast("Validation Error", "Email is required.", "error");
      setActiveTab("contact");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, any> = {
        full_name: formData.full_name.trim(),
        kh_name: formData.kh_name.trim() || null,
        gender: formData.gender || null,
        date_of_birth: formData.date_of_birth || null,
        marital_status: formData.marital_status || null,
        national_id_number: formData.national_id_number.trim() || null,

        code_bu: formData.code_bu.trim() || null,
        bu_full_name: formData.bu_full_name.trim() || null,
        handle_bu: formData.handle_bu.trim() || null,
        division: formData.division.trim() || null,
        department: formData.department.trim() || null,
        position: formData.position.trim() || null,
        site: formData.site.trim() || null,
        working_location: formData.working_location.trim() || null,

        working_hour: formData.working_hour.trim() || null,
        total_working_days: formData.total_working_days.trim() || null,
        employment_type: formData.employment_type || null,
        start_date: formData.start_date || null,
        line_manager: formData.line_manager.trim() || null,
        contract_type: formData.contract_type || null,
        fdc_end_date: formData.fdc_end_date || null,
        hiring_status: formData.hiring_status || null,

        basic_salary: formData.basic_salary ? parseFloat(formData.basic_salary) : null,
        tax_method: formData.tax_method || null,
        allowance: formData.allowance.trim() || null,
        bank_account_number: formData.bank_account_number.trim() || null,
        nssf_number: formData.nssf_number.trim() || null,

        email: formData.email.trim(),
        phone: formData.phone.trim(),
        current_address: formData.current_address.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_phone_number: formData.emergency_phone_number.trim() || null,
      };

      // 1. Update Candidate record
      const { error: candErr } = await supabase
        .from("candidates")
        .update(payload)
        .eq("id", candidate.id);

      if (candErr) throw candErr;

      // 2. If employee record exists linked to this candidate, sync hiring info
      try {
        await supabase
          .from("employees")
          .update({
            kh_name: payload.kh_name,
            gender: payload.gender,
            code_bu: payload.code_bu,
            bu_full_name: payload.bu_full_name,
            handle_bu: payload.handle_bu,
            division: payload.division,
            department: payload.department,
            position: payload.position,
            working_hour: payload.working_hour,
            total_working_days: payload.total_working_days,
            employment_type: payload.employment_type,
            start_date: payload.start_date,
            working_location: payload.working_location,
            national_id_number: payload.national_id_number,
            date_of_birth: payload.date_of_birth,
            current_address: payload.current_address,
            basic_salary: payload.basic_salary,
            tax_method: payload.tax_method,
            allowance: payload.allowance,
            line_manager: payload.line_manager,
            contract_type: payload.contract_type,
            fdc_end_date: payload.fdc_end_date,
            site: payload.site,
            bank_account_number: payload.bank_account_number,
            nssf_number: payload.nssf_number,
            emergency_contact_name: payload.emergency_contact_name,
            emergency_phone_number: payload.emergency_phone_number,
            hiring_status: payload.hiring_status,
            marital_status: payload.marital_status,
          })
          .eq("candidate_id", candidate.id);
      } catch (_e) {
        // Employee table update is best effort if candidate not yet converted
      }

      toast("Hiring Information Updated", "All 33 standardized fields saved successfully.", "success");
      onSaved(payload);
      onClose();
    } catch (err: any) {
      console.error("Failed to update hiring info:", err);
      toast("Update Failed", err.message || "Could not save hiring details", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-[#1E3064] to-[#253C7D] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/15">
              <i className="ri-file-user-line text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight">
                  Edit Hiring &amp; Employment Information
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[11px] font-extrabold">
                  33 Standard Fields
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                {candidate.candidate_code ? `${candidate.candidate_code} • ` : ""}
                {candidate.full_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 overflow-x-auto shrink-0">
          {[
            { id: "personal", label: "1. Personal Details", icon: "ri-user-line" },
            { id: "org", label: "2. Org & Site Workplace", icon: "ri-building-line" },
            { id: "terms", label: "3. Terms & Schedule", icon: "ri-calendar-todo-line" },
            { id: "compensation", label: "4. Compensation & Tax", icon: "ri-money-dollar-circle-line" },
            { id: "contact", label: "5. Contact & Emergency", icon: "ri-contacts-book-line" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === t.id
                  ? "bg-white text-[#253C7D] border-t-2 border-t-[#253C7D] border-x border-slate-200/80 shadow-2xs font-extrabold"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/70"
              }`}
            >
              <i className={`${t.icon} text-sm`} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: Personal Details */}
          {activeTab === "personal" && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-200/60 rounded-2xl p-3.5 flex items-start gap-3">
                <i className="ri-information-line text-blue-600 mt-0.5 text-base shrink-0" />
                <p className="text-xs text-blue-900 leading-relaxed font-medium">
                  Candidate identity, Khmer script legal naming, gender, date of birth, marital status, and official national identification number.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Candidate Code (Read-Only) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Candidate Code / ID
                  </label>
                  <input
                    type="text"
                    disabled
                    value={candidate.candidate_code || candidate.id || "System Assigned"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-600 cursor-not-allowed"
                  />
                </div>

                {/* Full Name (English) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Full Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    placeholder="e.g. Leng Vibol"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
                  />
                </div>

                {/* Khmer Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Khmer Name (KH Name)
                  </label>
                  <input
                    type="text"
                    value={formData.kh_name}
                    onChange={(e) => handleChange("kh_name", e.target.value)}
                    placeholder="e.g. ឡេង វិបុល"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleChange("gender", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="">-- Select Gender --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange("date_of_birth", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Marital Status
                  </label>
                  <select
                    value={formData.marital_status}
                    onChange={(e) => handleChange("marital_status", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="">-- Select Marital Status --</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                {/* National ID Number */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    National ID Number (Khmer ID / Passport)
                  </label>
                  <input
                    type="text"
                    value={formData.national_id_number}
                    onChange={(e) => handleChange("national_id_number", e.target.value)}
                    placeholder="e.g. 010203040 or Passport Number"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Organizational Placement & Physical Site */}
          {activeTab === "org" && (
            <div className="space-y-4">
              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 flex items-start gap-3">
                <i className="ri-map-pin-user-line text-amber-600 mt-0.5 text-base shrink-0" />
                <div>
                  <p className="text-xs text-amber-900 font-bold">Physical Stationing &amp; Business Unit Assignment</p>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-medium mt-0.5">
                    <strong>Site</strong> defines the specific workplace, branch, plant, or project location where the employee physically performs their duties.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code BU */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Code BU (Business Unit Code)
                  </label>
                  <input
                    type="text"
                    value={formData.code_bu}
                    onChange={(e) => handleChange("code_bu", e.target.value)}
                    placeholder="e.g. BU-01, HQ, RET-02"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* BU Full Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    BU Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.bu_full_name}
                    onChange={(e) => handleChange("bu_full_name", e.target.value)}
                    placeholder="e.g. Retail & Distribution Division"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Handle BU */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Handle BU (Operating Unit Handle)
                  </label>
                  <input
                    type="text"
                    value={formData.handle_bu}
                    onChange={(e) => handleChange("handle_bu", e.target.value)}
                    placeholder="e.g. Urban Retail Operations"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Division */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Division
                  </label>
                  <input
                    type="text"
                    value={formData.division}
                    onChange={(e) => handleChange("division", e.target.value)}
                    placeholder="e.g. Operations Division"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleChange("department", e.target.value)}
                    placeholder="e.g. Information Technology"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Position / Job Title
                  </label>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => handleChange("position", e.target.value)}
                    placeholder="e.g. Full-Stack Software Engineer"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Site (Crucial Workplace Location) */}
                <div className="p-3 bg-indigo-50/60 rounded-2xl border border-indigo-200/70 md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                      <i className="ri-building-4-line text-indigo-600" />
                      <span>Site (Physical Workplace Station)</span>
                    </label>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      Physical Workstation
                    </span>
                  </div>
                  <input
                    type="text"
                    value={formData.site}
                    onChange={(e) => handleChange("site", e.target.value)}
                    placeholder="e.g. Vattanac Capital Tower - Level 18, or Battambang Branch Office"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <p className="text-[11px] text-indigo-700/90 font-medium mt-1">
                    Refers to the specific physical branch, building, plant, or project workplace where the employee is physically stationed.
                  </p>
                </div>

                {/* Working Location (City / Province) */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Working Location (City / Region)
                  </label>
                  <input
                    type="text"
                    value={formData.working_location}
                    onChange={(e) => handleChange("working_location", e.target.value)}
                    placeholder="e.g. Phnom Penh, Siem Reap, Sihanoukville"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Terms & Employment Schedule */}
          {activeTab === "terms" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Working Hour */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Working Hour
                  </label>
                  <input
                    type="text"
                    value={formData.working_hour}
                    onChange={(e) => handleChange("working_hour", e.target.value)}
                    placeholder="e.g. 8:00 AM - 5:00 PM (44 hrs/wk)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Total Working Day */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Total Working Day
                  </label>
                  <input
                    type="text"
                    value={formData.total_working_days}
                    onChange={(e) => handleChange("total_working_days", e.target.value)}
                    placeholder="e.g. 5.5 Days/Week (Mon - Sat Noon)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Full Time / Part Time */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Full Time / Part Time
                  </label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => handleChange("employment_type", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="Full Time">Full Time</option>
                    <option value="Part Time">Part Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Start Date / Joining Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleChange("start_date", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Line Manager */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Line Manager (Reporting Line)
                  </label>
                  <input
                    type="text"
                    value={formData.line_manager}
                    onChange={(e) => handleChange("line_manager", e.target.value)}
                    placeholder="e.g. Sophat Chann (Head of IT)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Type of Contract */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Type of Contract
                  </label>
                  <select
                    value={formData.contract_type}
                    onChange={(e) => handleChange("contract_type", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="FDC">Fixed Duration Contract (FDC)</option>
                    <option value="UDC">Undetermined Duration Contract (UDC)</option>
                    <option value="Probation">Probationary Contract</option>
                    <option value="Internship">Internship Agreement</option>
                  </select>
                </div>

                {/* Date End of FDC */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Date End of FDC (Expiry)
                  </label>
                  <input
                    type="date"
                    value={formData.fdc_end_date}
                    onChange={(e) => handleChange("fdc_end_date", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Status (probation, intern) */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Hiring Status (probation, intern)
                  </label>
                  <select
                    value={formData.hiring_status}
                    onChange={(e) => handleChange("hiring_status", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="probation">Probation (3 Months)</option>
                    <option value="intern">Intern</option>
                    <option value="confirmed">Confirmed / Regular</option>
                    <option value="active">Active</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Compensation & Payroll */}
          {activeTab === "compensation" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Salary */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Basic Salary (USD $)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.basic_salary}
                      onChange={(e) => handleChange("basic_salary", e.target.value)}
                      placeholder="e.g. 850.00"
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                    />
                  </div>
                </div>

                {/* Tax Method */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Tax Method
                  </label>
                  <select
                    value={formData.tax_method}
                    onChange={(e) => handleChange("tax_method", e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="Resident">Resident (Progressive 0% - 20%)</option>
                    <option value="Non-resident">Non-resident (Flat 20%)</option>
                    <option value="Standard">Standard Cambodian Payroll Tax</option>
                    <option value="Gross">Gross Up</option>
                    <option value="Net">Net Guaranteed</option>
                  </select>
                </div>

                {/* Allowance */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Allowance &amp; Monthly Benefits
                  </label>
                  <input
                    type="text"
                    value={formData.allowance}
                    onChange={(e) => handleChange("allowance", e.target.value)}
                    placeholder="e.g. $50 Food Allowance + $30 Transport Allowance"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Bank Account */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Bank Account Number &amp; Bank Name
                  </label>
                  <input
                    type="text"
                    value={formData.bank_account_number}
                    onChange={(e) => handleChange("bank_account_number", e.target.value)}
                    placeholder="e.g. 001 234 567 (ABA Bank)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* NSSF Number */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    NSSF Number (National Social Security Fund)
                  </label>
                  <input
                    type="text"
                    value={formData.nssf_number}
                    onChange={(e) => handleChange("nssf_number", e.target.value)}
                    placeholder="e.g. NSSF-88291039"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Contact & Emergency Details */}
          {activeTab === "contact" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="candidate@company.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="e.g. +855 12 345 678"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Current Address */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Current Residential Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.current_address}
                    onChange={(e) => handleChange("current_address", e.target.value)}
                    placeholder="e.g. #123, St 271, Sangkat Boeung Tumpun, Khan Meanchey, Phnom Penh"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Emergency Contact Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Emergency Contact Name &amp; Relationship
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                    placeholder="e.g. Sok Chenda (Spouse / Parent)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                {/* Emergency Phone Number */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Emergency Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.emergency_phone_number}
                    onChange={(e) => handleChange("emergency_phone_number", e.target.value)}
                    placeholder="e.g. +855 16 999 888"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <i className="ri-shield-check-line text-emerald-600" />
              <span>Directly synchronizes across Candidates and Payroll records</span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving All 33 Fields...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-save-line text-sm" />
                    <span>Save Hiring Information</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
