import { lazy, Suspense, type ReactElement } from "react";
import type { RouteObject } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { RequireAdmin, RequireModule } from "@/components/RequirePermission";

const Home = lazy(() => import("../pages/home/page"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Login = lazy(() => import("../pages/auth/login"));
const ForgotPassword = lazy(() => import("../pages/auth/forgot-password"));
const ResetPassword = lazy(() => import("../pages/auth/reset-password"));
const Employees = lazy(() => import("../pages/employees/page"));
const EmployeeProfile = lazy(() => import("../pages/employees/EmployeeProfile"));
const Onboarding = lazy(() => import("../pages/onboarding/page"));
const Leave = lazy(() => import("../pages/leave/page"));
const PayrollModule = lazy(() => import("../pages/payroll/page"));
const Finance = lazy(() => import("../pages/finance/page"));
const ITManagement = lazy(() => import("../pages/it/page"));
const Hire = lazy(() => import("../pages/hire/page"));
const CandidateDetail = lazy(() => import("../pages/hire/CandidateDetail"));
const Offboard = lazy(() => import("../pages/offboard/page"));
const OrgChart = lazy(() => import("../pages/orgchart/page"));
const Tools = lazy(() => import("../pages/tools/page"));
const Benefits = lazy(() => import("../pages/benefits/page"));
const Settings = lazy(() => import("../pages/settings/page"));
const UnityApps = lazy(() => import("../pages/unity/page"));
const Branches = lazy(() => import("../pages/branches/page"));
const Notifications = lazy(() => import("../pages/notifications/page"));
const Analytics = lazy(() => import("../pages/analytics/page"));
const Reports = lazy(() => import("../pages/reports/page"));
const AuditLog = lazy(() => import("../pages/audit/page"));
const SelfService = lazy(() => import("../pages/self-service/page"));
const OnboardingChecklist = lazy(() => import("../pages/onboarding-checklist/page"));
const LeaveCalendar = lazy(() => import("../pages/leave-calendar/page"));
const PayrollApproval = lazy(() => import("../pages/payroll-approval/page"));
const Performance = lazy(() => import("../pages/performance/page"));
const Announcements = lazy(() => import("../pages/announcements/page"));
const Shifts = lazy(() => import("../pages/shifts/page"));
const MeetingRooms = lazy(() => import("../pages/meeting-rooms/page"));
const Tasks = lazy(() => import("../pages/tasks/page"));
const Attendance = lazy(() => import("../pages/attendance/page"));
const Training = lazy(() => import("../pages/training/page"));
const Disciplinary = lazy(() => import("../pages/disciplinary/page"));
const Documents = lazy(() => import("../pages/documents/page"));
const AdminPortal = lazy(() => import("../pages/admin/page"));
const Profile = lazy(() => import("../pages/profile/page"));

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
      { index: true, element: mod("dashboard", <Home />) },
      { path: "employees", element: mod("employees", <Employees />) },
      { path: "employees/:id", element: mod("employees", <EmployeeProfile />) },
      { path: "onboarding", element: mod("onboarding", <Onboarding />) },
      { path: "leave", element: mod("leave", <Leave />) },
      { path: "payroll-module", element: mod("payroll", <PayrollModule />) },
      { path: "finance", element: mod("finance", <Finance />) },
      { path: "it-management", element: mod("it-management", <ITManagement />) },
      { path: "hire", element: mod("hire", <Hire />) },
      { path: "hire/candidate/:id", element: mod("hire", <CandidateDetail />) },
      { path: "offboard", element: mod("offboard", <Offboard />) },
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
      { path: "leave-calendar", element: mod("leave-calendar", <LeaveCalendar />) },
      { path: "payroll-approval", element: mod("payroll-approval", <PayrollApproval />) },
      { path: "performance", element: mod("performance", <Performance />) },
      { path: "announcements", element: mod("announcements", <Announcements />) },
      { path: "shifts", element: mod("shifts", <Shifts />) },
      { path: "meeting-rooms", element: mod("meeting-rooms", <MeetingRooms />) },
      { path: "tasks", element: mod("tasks", <Tasks />) },
      { path: "attendance", element: mod("attendance", <Attendance />) },
      { path: "training", element: mod("training", <Training />) },
      { path: "disciplinary", element: mod("disciplinary", <Disciplinary />) },
      { path: "documents", element: mod("documents", <Documents />) },
      { path: "profile", element: <Suspense fallback={fallback}><Profile /></Suspense> },
      {
        path: "admin",
        element: <Suspense fallback={fallback}><RequireAdmin><AdminPortal /></RequireAdmin></Suspense>,
      },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export default routes;