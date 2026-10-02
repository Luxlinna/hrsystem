import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { EmployeeDetailHeader } from "./components/profile/EmployeeDetailHeader";
import { EmployeeDetailSidebar } from "./components/profile/EmployeeDetailSidebar";
import { EmployeeOverviewTabs, type OverviewTabKey } from "./components/overview/EmployeeOverviewTabs";
import { EmployeeProfileTab } from "./components/profile/EmployeeProfileTab";
import { JoiningInfoTab } from "./components/profile/JoiningInfoTab";
import { MovementInfoCard } from "./components/overview/MovementInfoCard";
import { ComplaintSuggestionCard } from "./components/overview/ComplaintSuggestionCard";
import { WarningInfoCard } from "./components/overview/WarningInfoCard";
import { PayrollHistoryCard } from "./components/profile/PayrollHistoryCard";
import { AssetInfoCard } from "./components/overview/AssetInfoCard";
import { QuickEditManagerModal } from "./components/profile/QuickEditManagerModal";
import { useEmployeeProfile } from "./hooks/useEmployeeProfile";
import { filterBuManagers } from "./hooks/employeeProfileLoader";

const TAB_ORDER: OverviewTabKey[] = [
  "personal",
  "joining",
  "movement",
  "complaints",
  "warning",
  "payroll",
  "assets",
];

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<OverviewTabKey>("personal");
  const [slideDirection, setSlideDirection] = useState<"next" | "prev">("next");
  const [showManagerModal, setShowManagerModal] = useState(false);

  const handleSelectTab = (newTab: OverviewTabKey) => {
    if (newTab === activeTab) return;
    const prevIdx = TAB_ORDER.indexOf(activeTab);
    const nextIdx = TAB_ORDER.indexOf(newTab);
    setSlideDirection(nextIdx >= prevIdx ? "next" : "prev");
    setActiveTab(newTab);
  };

  const {
    canEdit,
    canViewSalary,
    employee,
    loading,
    uploadingAvatar,
    manager,
    payrollRecords,
    form,
    userManagementUsers,
    loadEmployee,
    uploadAvatar,
  } = useEmployeeProfile(id);

  const dynamicBuManagers = useMemo(() => {
    const effectiveBranchId = form.branch_id || employee?.branch_id;
    const effectiveBuName = form.bu_full_name || employee?.bu_full_name || employee?.branches?.name;
    const effectiveCodeBu = form.code_bu || employee?.code_bu;

    return filterBuManagers(
      userManagementUsers,
      employee?.id,
      effectiveBranchId,
      effectiveBuName,
      effectiveCodeBu
    );
  }, [form.branch_id, form.bu_full_name, form.code_bu, employee, userManagementUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-10 text-center">
        <i className="ri-user-search-line text-4xl text-gray-300 mb-3 block" />
        <p className="text-gray-500">Employee not found</p>
        <Link to="/employees" className="text-[13px] text-[#253C7D] hover:underline mt-2 inline-block">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen bg-[#F7F9FA] dark:bg-slate-950 font-sans">
      <EmployeeDetailHeader employee={employee} />

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <EmployeeDetailSidebar
          employee={employee}
          canEdit={canEdit}
          uploadingAvatar={uploadingAvatar}
          onUploadAvatar={uploadAvatar}
        />

        <div className="flex-1 min-w-0 w-full overflow-hidden">
          <EmployeeOverviewTabs
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            canViewSalary={canViewSalary}
          />

          <div
            key={activeTab}
            className={`w-full ${
              slideDirection === "next" ? "animate-cover-next" : "animate-cover-prev"
            }`}
          >
            {activeTab === "personal" && <EmployeeProfileTab employee={employee} />}
            {activeTab === "joining" && <JoiningInfoTab employee={employee} manager={manager} />}
            {activeTab === "movement" && <MovementInfoCard employee={employee} />}
            {activeTab === "complaints" && <ComplaintSuggestionCard employee={employee} />}
            {activeTab === "warning" && <WarningInfoCard employee={employee} />}
            {activeTab === "payroll" && canViewSalary && (
              <PayrollHistoryCard employee={employee} payrollRecords={payrollRecords} />
            )}
            {activeTab === "assets" && <AssetInfoCard employee={employee} />}
          </div>
        </div>
      </div>

      {employee && (
        <QuickEditManagerModal
          isOpen={showManagerModal}
          onClose={() => setShowManagerModal(false)}
          employee={employee}
          manager={manager}
          allEmployees={dynamicBuManagers}
          onSuccess={() => id && loadEmployee(id)}
        />
      )}
    </div>
  );
}
