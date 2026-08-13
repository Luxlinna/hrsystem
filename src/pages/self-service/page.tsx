import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import PayslipTab from "./components/PayslipTab";
import LeaveTab from "./components/LeaveTab";
import BenefitsTab from "./components/BenefitsTab";
import CheckInTab from "./components/CheckInTab";
import AttendanceTab from "./components/AttendanceTab";
import DailyReportTab from "./components/DailyReportTab";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  status: string;
  join_date: string;
  email: string;
  avatar_url: string;
  branches: { name: string } | null;
}

const TABS = [
  { id: "payslips", label: "My Payslips", icon: "ri-file-list-3-line" },
  { id: "leave", label: "My Leave", icon: "ri-calendar-event-line" },
  { id: "attendance", label: "My Attendance", icon: "ri-time-line" },
  { id: "checkin", label: "Clock In/Out", icon: "ri-fingerprint-line" },
  { id: "daily-report", label: "Daily Report", icon: "ri-file-list-2-line" },
  { id: "benefits", label: "My Benefits", icon: "ri-heart-pulse-line" },
];

export default function SelfServicePage() {
  const { user } = useAuth();
  const { loading: permsLoading } = usePermissions();

  const [searchParams] = useSearchParams();
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "payslips");
  const quickCheckIn = searchParams.get("quickCheckIn") === "1";
  const quickCheckOut = searchParams.get("quickCheckOut") === "1";
  const [loading, setLoading] = useState(true);
  const [noOwnRecord, setNoOwnRecord] = useState(false);

  // The router keeps this page mounted across search-param-only navigations
  // (e.g. a Quick Action link or the geofence alert sending the user back to
  // /self-service?tab=checkin while already on this route), so activeTab's
  // useState initializer alone won't pick up a later tab= change.
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t) setActiveTab(t);
  }, [searchParams]);

  // Self-service is strictly "your own account, your own actions" — actions like
  // Clock In/Out post as whichever employee is loaded here, so this must always
  // resolve to the signed-in user's own record and never anyone else's.
  useEffect(() => {
    if (permsLoading) return;
    if (!user?.email) { setLoading(false); return; }

    const SELECT = "id, first_name, last_name, role, department, status, join_date, email, avatar_url, branches(name)";
    supabase
      .from("employees")
      .select(SELECT)
      .eq("email", user.email)
      .maybeSingle()
      .then(({ data }) => {
        const emp = data as unknown as Employee | null;
        if (emp) {
          setSelectedEmployee(emp);
        } else {
          setNoOwnRecord(true);
        }
        setLoading(false);
      });
  }, [permsLoading, user?.email]);

  const yearsAtCompany = selectedEmployee?.join_date
    ? Math.floor((new Date().getTime() - new Date(selectedEmployee.join_date).getTime()) / (365.25 * 86400000))
    : 0;

  if (loading || permsLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (noOwnRecord) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <i className="ri-user-search-line text-3xl text-gray-300 mb-3 block" />
          <h2 className="text-lg font-bold text-gray-900">No employee record found</h2>
          <p className="text-sm text-gray-500 mt-1">
            We couldn't find an employee record matching your account email ({user?.email}). Ask HR to link your profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F7] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Employee Self-Service
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Access your payslips, leave requests, and benefits enrollment</p>
      </div>

      {/* Employee Selector Banner */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-1">
            {selectedEmployee && (
              <>
                <img
                  src={selectedEmployee.avatar_url || `https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%20person%20in%20business%20attire%20against%20neutral%20office%20background&width=80&height=80&seq=emp-${selectedEmployee.id}&orientation=squarish`}
                  alt={selectedEmployee.first_name}
                  className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                />
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedEmployee.first_name} {selectedEmployee.last_name}</h2>
                  <p className="text-sm text-gray-500">{selectedEmployee.role} · {selectedEmployee.department}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <i className="ri-building-line" />{selectedEmployee.branches?.name || "HQ"}
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <i className="ri-calendar-line" />{yearsAtCompany} yr{yearsAtCompany !== 1 ? "s" : ""} at company
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="inline-flex text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full capitalize">{selectedEmployee.status}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-5 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.id ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <i className={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6">
        {selectedEmployee && (
          <>
            {activeTab === "payslips" && (
              <PayslipTab employeeId={selectedEmployee.id} employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`} />
            )}
            {activeTab === "leave" && (
              <LeaveTab employeeId={selectedEmployee.id} />
            )}
            {activeTab === "attendance" && (
              <AttendanceTab employeeId={selectedEmployee.id} />
            )}
            {activeTab === "checkin" && (
              <CheckInTab
                employeeId={selectedEmployee.id}
                employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`}
                autoStart={quickCheckIn}
                autoCheckOut={quickCheckOut}
              />
            )}
            {activeTab === "daily-report" && (
              <DailyReportTab employeeId={selectedEmployee.id} />
            )}
            {activeTab === "benefits" && (
              <BenefitsTab employeeId={selectedEmployee.id} />
            )}
          </>
        )}
      </div>
    </div>
  );
}