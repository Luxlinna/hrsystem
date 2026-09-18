import React from "react";
import { NOTICE_PERIOD_OPTIONS } from "@/pages/hire/constants";

interface ProfileCredentialsFormProps {
  location: string;
  setLocation: (val: string) => void;
  noticePeriod: string;
  setNoticePeriod: (val: string) => void;
  expectedSalary: string;
  setExpectedSalary: (val: string) => void;
  education: string;
  setEducation: (val: string) => void;
  workExperience: string;
  setWorkExperience: (val: string) => void;
}

export function ProfileCredentialsForm({
  location,
  setLocation,
  noticePeriod,
  setNoticePeriod,
  expectedSalary,
  setExpectedSalary,
  education,
  setEducation,
  workExperience,
  setWorkExperience,
}: ProfileCredentialsFormProps) {
  return (
    <>
      {/* ── Availability, Location & Compensation ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
        <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <i className="ri-compass-3-line text-[#253C7D] text-[15px]"></i>
          <span>Location & Availability</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location */}
          <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/60 focus-within:border-[#253C7D] focus-within:bg-white transition-all">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Current Location / City
            </label>
            <div className="flex items-center gap-2">
              <i className="ri-map-pin-2-line text-gray-400 text-[15px]"></i>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Phnom Penh, Cambodia"
                className="w-full bg-transparent text-[13px] font-semibold text-gray-900 focus:outline-none placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Notice Period */}
          <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/60 focus-within:border-[#253C7D] focus-within:bg-white transition-all">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Notice Period / Availability
            </label>
            <div className="flex items-center gap-2">
              <i className="ri-calendar-check-line text-gray-400 text-[15px]"></i>
              <select
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                className="w-full bg-transparent text-[13px] font-semibold text-gray-900 focus:outline-none cursor-pointer"
              >
                {NOTICE_PERIOD_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expected Salary */}
          <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200/60 focus-within:border-[#253C7D] focus-within:bg-white transition-all">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Expected Salary (USD / mo)
            </label>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-bold text-[14px]">$</span>
              <input
                type="number"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="e.g. 1500"
                min="0"
                step="50"
                className="w-full bg-transparent text-[13px] font-semibold text-gray-900 focus:outline-none placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Professional Background (Education & Experience) ── */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-6">
        <h4 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <i className="ri-briefcase-line text-[#253C7D] text-[15px]"></i>
          <span>Education & Experience Credentials</span>
        </h4>

        {/* Education Background */}
        <div>
          <label className="text-[12px] font-bold text-gray-700 flex items-center gap-2 mb-2">
            <i className="ri-graduation-cap-line text-blue-600"></i>
            <span>Education Background</span>
          </label>
          <textarea
            rows={3}
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="e.g. Bachelor of Science in Computer Science & Information Technology, Royal University of Phnom Penh (2018 - 2022)"
            className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-[13px] text-gray-800 focus:outline-none focus:border-[#253C7D] focus:bg-white transition-all resize-y"
          />
        </div>

        {/* Work Experience */}
        <div>
          <label className="text-[12px] font-bold text-gray-700 flex items-center gap-2 mb-2">
            <i className="ri-history-line text-indigo-600"></i>
            <span>Work Experience Summary</span>
          </label>
          <textarea
            rows={4}
            value={workExperience}
            onChange={(e) => setWorkExperience(e.target.value)}
            placeholder="e.g. 4+ years in software engineering and cloud infrastructure. Led team of 5 engineers delivering high-availability microservices and real-time HR automation platforms."
            className="w-full px-4 py-3 bg-gray-50/80 border border-gray-200 rounded-2xl text-[13px] text-gray-800 focus:outline-none focus:border-[#253C7D] focus:bg-white transition-all resize-y"
          />
        </div>
      </div>
    </>
  );
}
