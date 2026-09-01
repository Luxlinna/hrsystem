import { memo } from "react";
import type { TrainingTab, Course, Enrollment } from "../types";
import { TrainingExportMenu } from "./TrainingExportMenu";

interface TrainingHeaderProps {
  activeTab: TrainingTab;
  setActiveTab: (t: TrainingTab) => void;
  totalEnrolled: number;
  totalCompleted: number;
  totalCerts: number;
  avgProgress: number;
  canManage: boolean;
  onNewCourse: () => void;
  onOpenEnroll: () => void;
  courses?: Course[];
  enrollments?: Enrollment[];
  certificates?: Enrollment[];
}

export const TrainingHeader = memo(function TrainingHeader({
  activeTab,
  setActiveTab,
  totalEnrolled,
  totalCompleted,
  totalCerts,
  avgProgress,
  canManage,
  onNewCourse,
  onOpenEnroll,
  courses = [],
  enrollments = [],
  certificates = [],
}: TrainingHeaderProps) {
  return (
    <div className="mb-6 space-y-5">
      {/* Top Title & CTA Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold text-gray-900"
          >
            Training &amp; Development
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage courses, employee enrollments, and professional certifications
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* 3-Format Export Menu */}
          <TrainingExportMenu
            activeTab={activeTab}
            courses={courses}
            enrollments={enrollments}
            certificates={certificates}
          />

          {canManage && (
            <>
              <button
                onClick={() => onOpenEnroll()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#253C7D] bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
              >
                <i className="ri-user-add-line" />
                Enroll Staff
              </button>
              <button
                onClick={() => onNewCourse()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#253C7D] hover:bg-[#1F336A] transition-colors shadow-2xs cursor-pointer"
              >
                <i className="ri-add-line font-bold text-sm" />
                New Course
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Active Learners
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalEnrolled}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Completed Courses
          </p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{totalCompleted}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Certificates Issued
          </p>
          <p className="text-2xl font-bold text-[#253C7D] mt-1">{totalCerts}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Average Progress
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{avgProgress}%</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {[
          { id: "courses" as const, label: "Course Catalog", icon: "ri-book-open-line" },
          { id: "calendar" as const, label: "Schedule & Deadlines", icon: "ri-calendar-event-line" },
          { id: "enrollments" as const, label: "Learner Enrollments", icon: "ri-group-line" },
          { id: "certificates" as const, label: "Certifications", icon: "ri-award-line" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === t.id
                ? "border-[#253C7D] text-[#253C7D]"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            <i className={t.icon} />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
});
