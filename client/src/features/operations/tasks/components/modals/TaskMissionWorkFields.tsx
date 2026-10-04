import { memo } from "react";
import type { Task } from "../../types";
import type { LocationData } from "./TaskOutsideWorkMissionForm";
import { TaskMissionScheduleLocation } from "./TaskMissionScheduleLocation";

interface TaskMissionWorkFieldsProps {
  missionType: string;
  setMissionType: (t: string) => void;
  missionFor: "daily" | "hourly" | "half_day";
  setMissionFor: (m: "daily" | "hourly" | "half_day") => void;
  subject: string;
  setSubject: (s: string) => void;
  fromDate: string;
  setFromDate: (d: string) => void;
  toDate: string;
  setToDate: (d: string) => void;
  totalDays: number;
  setTotalDays: (v: number | ((prev: number) => number)) => void;
  priority: Task["priority"];
  setPriority: (p: Task["priority"]) => void;
  location: LocationData | null;
  setLocation: (loc: LocationData | null) => void;
  detail: string;
  setDetail: (d: string) => void;
  remark: string;
  setRemark: (r: string) => void;
}

export const TaskMissionWorkFields = memo(function TaskMissionWorkFields({
  missionType,
  setMissionType,
  missionFor,
  setMissionFor,
  subject,
  setSubject,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  totalDays,
  setTotalDays,
  priority,
  setPriority,
  location,
  setLocation,
  detail,
  setDetail,
  remark,
  setRemark,
}: TaskMissionWorkFieldsProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
      <h3 className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">
        MISSION / OUTSIDE WORK INFO
      </h3>

      {/* Mission Type */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          Mission Type <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9">
          <select
            value={missionType}
            onChange={(e) => setMissionType(e.target.value)}
            required
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="">Search...</option>
            <option value="Official Mission">Official Mission</option>
            <option value="Client Visit">Client Visit</option>
            <option value="Branch Audit">Branch Audit</option>
            <option value="Site Inspection">Site Inspection</option>
            <option value="Project Deployment">Project Deployment</option>
            <option value="Technical Support">Technical Support</option>
            <option value="Training Mission">Training Mission</option>
            <option value="Conference">Conference / Seminar</option>
            <option value="Delivery / Fieldwork">Delivery / Fieldwork</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Mission For */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          Mission For
        </label>
        <div className="sm:col-span-9 flex items-center gap-6 text-xs text-gray-700 dark:text-slate-200">
          {(["daily", "hourly", "half_day"] as const).map((mode) => (
            <label key={mode} className="inline-flex items-center gap-2 cursor-pointer capitalize">
              <input
                type="radio"
                name="missionForRadio"
                value={mode}
                checked={missionFor === mode}
                onChange={() => setMissionFor(mode)}
                className="text-[#0284c7] focus:ring-sky-500"
              />
              <span>{mode === "half_day" ? "Half Day" : mode}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Mission Subject */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          Mission Subject <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9">
          <input
            type="text"
            required
            placeholder="e.g. Site Survey at Toul Kork, Client Demo"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          Priority
        </label>
        <div className="sm:col-span-9">
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Task["priority"])}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Dates, Stepper & GPS Location */}
      <TaskMissionScheduleLocation
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        totalDays={totalDays}
        setTotalDays={setTotalDays}
        location={location}
        setLocation={setLocation}
      />

      {/* Mission Detail */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300 pt-2">
          Mission Detail <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9">
          <textarea
            required
            rows={3}
            placeholder="Outline objectives, tasks, client points of contact, or expected outcomes"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* Remark */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300 pt-2">
          Remark
        </label>
        <div className="sm:col-span-9">
          <textarea
            rows={2}
            placeholder="Optional remarks, logistics instructions, or transport arrangements"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>
    </div>
  );
});
