import { lazy, Suspense, type ReactElement } from "react";
import { type RouteObject, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { RequireAdmin, RequireModule, RequireRecycleBin } from "@/components/RequirePermission";

const Home = lazy(() => import("@/features/home/home/page"));
const NotFound = lazy(() => import("@/features/NotFound"));
const Login = lazy(() => import("@/features/auth/auth/login"));
const ForgotPassword = lazy(() => import("@/features/auth/auth/forgot-password"));
const ResetPassword = lazy(() => import("@/features/auth/auth/reset-password"));
const Employees = lazy(() => import("@/features/workforce/employees/page"));
const EmployeeProfile = lazy(() => import("@/features/workforce/employees/EmployeeProfile"));
const EmployeeSettingsPage = lazy(() => import("@/features/workforce/employees/settings/EmployeeSettingsPage"));
const Onboarding = lazy(() => import("@/features/workforce/onboarding/page"));
const Leave = lazy(() => import("@/features/time-attendance/leave/page"));
const PayrollModule = lazy(() => import("@/features/payroll-finance/payroll/page"));
const Finance = lazy(() => import("@/features/payroll-finance/finance/page"));
const ITManagement = lazy(() => import("@/features/operations/it/page"));
const Hire = lazy(() => import("@/features/talent-recruitment/hire/page"));
const CandidateDetail = lazy(() => import("@/features/talent-recruitment/hire/CandidateDetail"));
const Offboard = lazy(() => import("@/features/workforce/offboard/page"));
const ExitPage = lazy(() => import("@/features/workforce/exit/page"));
const ExitSettingsPage = lazy(() => import("@/features/workforce/exit/settings/ExitSettingsPage"));
const ComplaintsPage = lazy(() => import("@/features/employee-relations/complaints/page"));
const OrgChart = lazy(() => import("@/features/organization/orgchart/page"));
const Tools = lazy(() => import("@/features/operations/tools/page"));
const Benefits = lazy(() => import("@/features/payroll-finance/benefits/page"));
const Settings = lazy(() => import("@/features/system-admin/settings/page"));
const UnityApps = lazy(() => import("@/features/organization/unity/page"));
const Branches = lazy(() => import("@/features/organization/branches/page"));
const Notifications = lazy(() => import("@/features/system-admin/notifications/page"));
const Analytics = lazy(() => import("@/features/system-admin/analytics/page"));
const Reports = lazy(() => import("@/features/system-admin/reports/page"));
const AuditLog = lazy(() => import("@/features/system-admin/audit/page"));
const SelfService = lazy(() => import("@/features/self-service/self-service/page"));
const OnboardingChecklist = lazy(() => import("@/features/workforce/onboarding-checklist/page"));
const LeaveCalendar = lazy(() => import("@/features/time-attendance/leave-calendar/page"));
const PayrollApproval = lazy(() => import("@/features/payroll-finance/payroll-approval/page"));
const Performance = lazy(() => import("@/features/employee-relations/performance/page"));
const Announcements = lazy(() => import("@/features/system-admin/announcements/page"));
const Shifts = lazy(() => import("@/features/time-attendance/shifts/page"));
const MeetingRooms = lazy(() => import("@/features/operations/meeting-rooms/page"));
const Tasks = lazy(() => import("@/features/operations/tasks/page"));
const Attendance = lazy(() => import("@/features/time-attendance/attendance/page"));
const Training = lazy(() => import("@/features/employee-relations/training/page"));
const Disciplinary = lazy(() => import("@/features/employee-relations/disciplinary/page"));
const WarningSettingsPage = lazy(() => import("@/features/employee-relations/disciplinary/settings/WarningSettingsPage"));
const Documents = lazy(() => import("@/features/operations/documents/page"));
const Movements = lazy(() => import("@/features/workforce/movements/page"));
const AdminPortal = lazy(() => import("@/features/system-admin/admin/page"));
const RecycleBin = lazy(() => import("@/features/system-admin/recycle-bin/page"));
const Profile = lazy(() => import("@/features/workforce/profile/page"));

const fallback = <div className="p-10 text-center text-gray-400">Loading...</div>;

// Wraps a lazy page in its Suspense boundary plus a module-permission guard.
// `module` must match a key in ALL_MODULES / app_roles.allowed_modules.
function mod(module: string, element: ReactElement) {
  return (
    <Suspense fallback={fallback}>
      <RequireModule module={module}>{element}</RequireModule>
    </Suspense>
  );
}

const routes: RouteObject[] = [
  { path: "/login", element: <Suspense fallback={fallback}><Login /></Suspense> },
  { path: "/forgot-password", element: <Suspense fallback={fallback}><ForgotPassword /></Suspense> },
  { path: "/reset-password", element: <Suspense fallback={fallback}><ResetPassword /></Suspense> },
  {
    path: "/",
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Navigate to="/self-service" replace /> },
      { path: "dashboard", element: mod("dashboard", <Home />) },
      { path: "employees", element: mod("employees", <Employees />) },
      { path: "employees/settings", element: mod("employees", <EmployeeSettingsPage />) },
      { path: "employees/:id", element: mod("employees", <EmployeeProfile />) },
      { path: "onboarding", element: mod("onboarding", <Onboarding />) },
      { path: "leave", element: mod("leave", <Leave />) },
      { path: "payroll-module", element: mod("payroll", <PayrollModule />) },
      { path: "finance", element: mod("finance", <Finance />) },
      { path: "it-management", element: mod("it-management", <ITManagement />) },
      { path: "assets", element: mod("it-management", <ITManagement />) },
      { path: "hire", element: mod("hire", <Hire />) },
      { path: "hire/candidate/:id", element: mod("hire", <CandidateDetail />) },
      { path: "hire/candidates/:id", element: mod("hire", <CandidateDetail />) },
      { path: "offboard", element: mod("offboard", <Offboard />) },
      { path: "exit", element: mod("exit", <ExitPage />) },
      { path: "exit/settings", element: mod("exit", <ExitSettingsPage />) },
      { path: "complaints", element: mod("complaints", <ComplaintsPage />) },
      { path: "org-chart", element: mod("org-chart", <OrgChart />) },
      { path: "tools", element: mod("tools", <Tools />) },
      { path: "benefits", element: mod("benefits", <Benefits />) },
      { path: "settings", element: mod("settings", <Settings />) },
      { path: "unity-apps", element: mod("unity-apps", <UnityApps />) },
      { path: "branches", element: mod("branches", <Branches />) },
      { path: "notifications", element: mod("notifications", <Notifications />) },
      { path: "analytics", element: mod("analytics", <Analytics />) },
      { path: "reports", element: mod("reports", <Reports />) },
      { path: "audit-log", element: mod("audit-log", <AuditLog />) },
      { path: "self-service", element: mod("self-service", <SelfService />) },
      { path: "onboarding-checklist", element: mod("onboarding-checklist", <OnboardingChecklist />) },
      { path: "leave-calendar", element: <Navigate to="/leave?tab=calendar" replace /> },
      { path: "payroll-approval", element: mod("payroll-approval", <PayrollApproval />) },
      { path: "performance", element: mod("performance", <Performance />) },
      { path: "announcements", element: mod("announcements", <Announcements />) },
      { path: "shifts", element: mod("shifts", <Shifts />) },
      { path: "meeting-rooms", element: mod("meeting-rooms", <MeetingRooms />) },
      { path: "tasks", element: mod("tasks", <Tasks />) },
      { path: "attendance", element: mod("attendance", <Attendance />) },
      { path: "training", element: mod("training", <Training />) },
      { path: "disciplinary", element: mod("disciplinary", <Disciplinary />) },
      { path: "disciplinary/create", element: mod("disciplinary", <Disciplinary />) },
      { path: "disciplinary/settings", element: mod("disciplinary", <WarningSettingsPage />) },
      { path: "warnings", element: mod("disciplinary", <Disciplinary />) },
      { path: "warnings/create", element: mod("disciplinary", <Disciplinary />) },
      { path: "warnings/settings", element: mod("disciplinary", <WarningSettingsPage />) },
      { path: "documents", element: mod("documents", <Documents />) },
      { path: "movements", element: mod("employees", <Movements />) },
      { path: "change-status", element: mod("employees", <Movements />) },
      { path: "change-statuses", element: mod("employees", <Movements />) },
      { path: "profile", element: <Suspense fallback={fallback}><Profile /></Suspense> },
      {
        path: "admin",
        element: <Suspense fallback={fallback}><RequireAdmin><AdminPortal /></RequireAdmin></Suspense>,
      },
      {
        path: "recycle-bin",
        element: <Suspense fallback={fallback}><RequireRecycleBin><RecycleBin /></RequireRecycleBin></Suspense>,
      },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export default routes;
