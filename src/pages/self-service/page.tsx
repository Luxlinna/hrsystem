import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import PayslipTab from "./components/PayslipTab";
import LeaveTab from "./components/LeaveTab";
import BenefitsTab from "./components/BenefitsTab";
import CheckInTab from "./components/CheckInTab";
import AttendanceTab from "./components/AttendanceTab";

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
  { id: "benefits", label: "My Benefits", icon: "ri-heart-pulse-line" },
];

export default function SelfServicePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activeTab, setActiveTab] = useState("payslips");
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, status, join_date, email, avatar_url, branches(name)")
      .eq("status", "active")
      .order("first_name")
      .then(({ data }) => {
        setEmployees((data as unknown as Employee[]) || []);
        if (data && data.length > 0) {
          const emp = data[0] as unknown as Employee;
          setSelectedId(emp.id);
          setSelectedEmployee(emp);
        }
        setLoading(false);
      });
  }, []);

  const handleSelect = (emp: Employee) => {
    setSelectedId(emp.id);
    setSelectedEmployee(emp);
    setDropdownOpen(false);
    setActiveTab("payslips");
  };

  const yearsAtCompany = selectedEmployee?.join_date
    ? Math.floor((new Date().getTime() - new Date(selectedEmployee.join_date).getTime()) / (365.25 * 86400000))
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
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
                  <div className="flex items-center gap-3 mt-1">
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

          {/* Employee Picker */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-exchange-line" />
              Switch Employee
              {dropdownOpen ? <i className="ri-arrow-up-s-line text-gray-400" /> : <i className="ri-arrow-down-s-line text-gray-400" />}
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 rounded-xl overflow-hidden z-30 max-h-72 overflow-y-auto">
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelect(emp)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer text-left ${selectedId === emp.id ? "bg-[#0D7377]/5" : ""}`}
                  >
                    <img
                      src={emp.avatar_url || `https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%20person%20in%20business%20attire%20against%20neutral%20background&width=40&height=40&seq=picker-${emp.id}&orientation=squarish`}
                      alt={emp.first_name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs text-gray-400 truncate">{emp.role}</p>
                    </div>
                    {selectedId === emp.id && <i className="ri-checkbox-circle-fill text-[#0D7377] shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {dropdownOpen && <div className="fixed inset-0 z-20" onClick={() => setDropdownOpen(false)} />}

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
              <CheckInTab employeeId={selectedEmployee.id} employeeName={`${selectedEmployee.first_name} ${selectedEmployee.last_name}`} />
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