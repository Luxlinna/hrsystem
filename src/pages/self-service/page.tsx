import { useSelfServiceData } from "./hooks/useSelfServiceData";
import { ProfileBanner } from "./components/ProfileBanner";
import { OverviewGrid } from "./components/OverviewGrid";
import { TabsNav } from "./components/TabsNav";
import { TabContent } from "./components/TabContent";
import { SelfServiceExportMenu } from "./components/SelfServiceExportMenu";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";

export default function SelfServicePage() {
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
    pendingLeaveCount,
    latestPayslip,
    unreadCount,
    activeOutsideWork,
    user,
  } = useSelfServiceData();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (noOwnRecord) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 sm:p-6">
        <div className="text-center max-w-sm bg-white p-6 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <i className="ri-user-search-line text-2xl" />
          </div>
          <h2 className="text-base font-bold text-slate-900">No employee record found</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            We couldn't find an employee profile matching your account{" "}
            {isPhoneSyntheticEmail(user?.email)
              ? `phone number (${formatDisplayPhone(syntheticEmailToPhone(user?.email))})`
              : `email (${user?.email})`}. Please ask HR to link your employee profile.
          </p>
        </div>
      </div>
    );
  }

  const employeeName = selectedEmployee
    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
    : "";

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-3.5 sm:px-6 lg:px-8 pt-5 sm:pt-8 pb-24 font-sans">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-5">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>WORKSPACE</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">SELF-SERVICE</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Employee Self-Service
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-0.5">
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
          <ProfileBanner employee={selectedEmployee} managerName={managerName} />
        )}

        {/* KPI Overview Grid */}
        {selectedEmployee && (
          <OverviewGrid
            activeTab={activeTab}
            onTabChange={setActiveTab}
            todayAttendance={todayAttendance}
            pendingLeaveCount={pendingLeaveCount}
            latestPayslip={latestPayslip}
            unreadCount={unreadCount}
            activeOutsideWork={activeOutsideWork}
          />
        )}

        {/* Tab Navigation Strip */}
        <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content Container */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs p-4 sm:p-6">
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
