import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelfServiceData } from "./hooks/useSelfServiceData";
import { ProfileBanner } from "./components/ProfileBanner";
import { TabsNav } from "./components/TabsNav";
import { TabContent } from "./components/TabContent";
import { SelfServiceExportMenu } from "./components/SelfServiceExportMenu";
import { MobilePresenceAttendance } from "./components/MobilePresenceAttendance";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";

import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

export default function SelfServicePage() {
  const [searchParams] = useSearchParams();
  const {
    selectedEmployee,
    activeTab,
    setActiveTab,
    quickCheckIn,
    quickCheckOut,
    loading,
    noOwnRecord,
    managerName,
    todayAttendance,
    user,
    pendingLeaveCount,
    unreadCount,
  } = useSelfServiceData();

  const [mobileViewMode, setMobileViewMode] = useState<"presence" | "tab">("presence");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam) {
      setMobileViewMode("tab");
    } else {
      setMobileViewMode("presence");
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 dark:border-slate-100 border-t-transparent dark:border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (noOwnRecord) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6">
        <div className="text-center max-w-sm bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500 dark:text-slate-400">
            <i className="ri-user-search-line text-2xl" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">No employee record found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            We couldn't find an employee profile matching your account{" "}
            {isPhoneSyntheticEmail(user?.email)
              ? `phone number (${formatDisplayPhone(syntheticEmailToPhone(user?.email))})`
              : `email (${user?.email})`}. Please ask HR to link your employee profile.
          </p>
        </div>
      </div>
    );
  }

  const employeeName = selectedEmployee ? formatKhmerFullName(selectedEmployee) : "";

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-slate-950 px-0 md:px-6 lg:px-8 pt-0 md:pt-8 pb-24 font-sans">
      {/* ── Mobile View: Presence Structure (< md) ── */}
      <div className="block md:hidden max-w-md mx-auto">
        {selectedEmployee && mobileViewMode === "presence" ? (
          <MobilePresenceAttendance
            employee={selectedEmployee}
            managerName={managerName}
            activeTab={activeTab}
            setActiveTab={(tab) => {
              setActiveTab(tab);
              setMobileViewMode("tab");
            }}
            unreadCount={unreadCount}
            pendingLeaveCount={pendingLeaveCount}
          />
        ) : (
          <div className="space-y-4">
            {/* Tab Navigation Strip */}
            <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Content Container */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xs p-4">
              {selectedEmployee && (
                <TabContent
                  activeTab={activeTab}
                  employee={selectedEmployee}
                  employeeName={employeeName}
                  quickCheckIn={quickCheckIn}
                  quickCheckOut={quickCheckOut}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop View (>= md) ── */}
      <div className="hidden md:block max-w-6xl mx-auto space-y-4 sm:space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <span>WORKSPACE</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-slate-600 dark:text-slate-400">SELF-SERVICE</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              Employee Self-Service
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-0.5">
              Personal hub for payslips, leave requests, attendance logs, and benefits
            </p>
          </div>

          {/* Export Action */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SelfServiceExportMenu
              activeTab={activeTab}
              employee={selectedEmployee}
            />
          </div>
        </div>

        {/* Profile Identity Card */}
        {selectedEmployee && (
          <ProfileBanner
            employee={selectedEmployee}
            managerName={managerName}
            todayAttendance={todayAttendance}
            onGoToCheckIn={activeTab !== "checkin" ? () => setActiveTab("checkin") : undefined}
          />
        )}

        {/* Tab Navigation Strip */}
        <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content Container */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-2xs p-4 sm:p-6">
          {selectedEmployee && (
            <TabContent
              activeTab={activeTab}
              employee={selectedEmployee}
              employeeName={employeeName}
              quickCheckIn={quickCheckIn}
              quickCheckOut={quickCheckOut}
            />
          )}
        </div>
      </div>
    </div>
  );
}
