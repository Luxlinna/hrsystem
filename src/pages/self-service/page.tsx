import { useSelfServiceData } from "./hooks/useSelfServiceData";
import { ProfileBanner } from "./components/ProfileBanner";
import { OverviewGrid } from "./components/OverviewGrid";
import { TabsNav } from "./components/TabsNav";
import { TabContent } from "./components/TabContent";
import { SelfServiceExportMenu } from "./components/SelfServiceExportMenu";

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
    activeTabMeta,
    user,
  } = useSelfServiceData();

  if (loading) {
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

  const employeeName = selectedEmployee
    ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
    : "";

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Self-Service</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Employee Self-Service
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Access your payslips, leave requests, attendance, and benefits enrollment.
          </p>
        </div>

        {/* 3-Format Export Dropdown */}
        <div className="flex items-center gap-2.5">
          <SelfServiceExportMenu
            activeTab={activeTab}
            employee={selectedEmployee}
          />
        </div>
      </div>

      {selectedEmployee && (
        <ProfileBanner employee={selectedEmployee} managerName={managerName} />
      )}

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

      {/* Tabs */}
      <TabsNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="flex items-center gap-2 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center shrink-0">
            <i className={`${activeTabMeta.icon} text-sm`} />
          </div>
          <h3 className="text-sm font-bold text-gray-900">{activeTabMeta.label}</h3>
        </div>
        <div className="p-6">
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
