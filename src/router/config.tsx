import { lazy, Suspense } from "react";
import type { RouteObject } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

const Home = lazy(() => import("../pages/home/page"));
const NotFound = lazy(() => import("../pages/NotFound"));
const Login = lazy(() => import("../pages/auth/login"));
const Signup = lazy(() => import("../pages/auth/signup"));
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
const Attendance = lazy(() => import("../pages/attendance/page"));
const Training = lazy(() => import("../pages/training/page"));
const Disciplinary = lazy(() => import("../pages/disciplinary/page"));
const Documents = lazy(() => import("../pages/documents/page"));
const AdminPortal = lazy(() => import("../pages/admin/page"));

const fallback = <div className="p-10 text-center text-gray-400">Loading...</div>;

const routes: RouteObject[] = [
  { path: "/login", element: <Suspense fallback={fallback}><Login /></Suspense> },
  { path: "/signup", element: <Suspense fallback={fallback}><Signup /></Suspense> },
  {
    path: "/",
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Suspense fallback={fallback}><Home /></Suspense> },
      { path: "employees", element: <Suspense fallback={fallback}><Employees /></Suspense> },
      { path: "employees/:id", element: <Suspense fallback={fallback}><EmployeeProfile /></Suspense> },
      { path: "onboarding", element: <Suspense fallback={fallback}><Onboarding /></Suspense> },
      { path: "leave", element: <Suspense fallback={fallback}><Leave /></Suspense> },
      { path: "payroll-module", element: <Suspense fallback={fallback}><PayrollModule /></Suspense> },
      { path: "finance", element: <Suspense fallback={fallback}><Finance /></Suspense> },
      { path: "it-management", element: <Suspense fallback={fallback}><ITManagement /></Suspense> },
      { path: "hire", element: <Suspense fallback={fallback}><Hire /></Suspense> },
      { path: "hire/candidate/:id", element: <Suspense fallback={fallback}><CandidateDetail /></Suspense> },
      { path: "offboard", element: <Suspense fallback={fallback}><Offboard /></Suspense> },
      { path: "org-chart", element: <Suspense fallback={fallback}><OrgChart /></Suspense> },
      { path: "tools", element: <Suspense fallback={fallback}><Tools /></Suspense> },
      { path: "benefits", element: <Suspense fallback={fallback}><Benefits /></Suspense> },
      { path: "settings", element: <Suspense fallback={fallback}><Settings /></Suspense> },
      { path: "unity-apps", element: <Suspense fallback={fallback}><UnityApps /></Suspense> },
      { path: "branches", element: <Suspense fallback={fallback}><Branches /></Suspense> },
      { path: "notifications", element: <Suspense fallback={fallback}><Notifications /></Suspense> },
      { path: "analytics", element: <Suspense fallback={fallback}><Analytics /></Suspense> },
      { path: "reports", element: <Suspense fallback={fallback}><Reports /></Suspense> },
      { path: "audit-log", element: <Suspense fallback={fallback}><AuditLog /></Suspense> },
      { path: "self-service", element: <Suspense fallback={fallback}><SelfService /></Suspense> },
      { path: "onboarding-checklist", element: <Suspense fallback={fallback}><OnboardingChecklist /></Suspense> },
      { path: "leave-calendar", element: <Suspense fallback={fallback}><LeaveCalendar /></Suspense> },
      { path: "payroll-approval", element: <Suspense fallback={fallback}><PayrollApproval /></Suspense> },
      { path: "performance", element: <Suspense fallback={fallback}><Performance /></Suspense> },
      { path: "announcements", element: <Suspense fallback={fallback}><Announcements /></Suspense> },
      { path: "shifts", element: <Suspense fallback={fallback}><Shifts /></Suspense> },
      { path: "attendance", element: <Suspense fallback={fallback}><Attendance /></Suspense> },
      { path: "training", element: <Suspense fallback={fallback}><Training /></Suspense> },
      { path: "disciplinary", element: <Suspense fallback={fallback}><Disciplinary /></Suspense> },
      { path: "documents", element: <Suspense fallback={fallback}><Documents /></Suspense> },
      { path: "admin", element: <Suspense fallback={fallback}><AdminPortal /></Suspense> },
    ],
  },
  { path: "*", element: <NotFound /> },
];

export default routes;