// Maps a notification's `source` column to the module it's about, so
// clicking a notification can jump straight to the relevant page instead of
// just marking it read. `system` has no single destination and is omitted
// on purpose — those notifications only get marked read on click.
export const NOTIFICATION_SOURCE_ROUTES: Record<string, { path: string; module: string }> = {
  hire: { path: "/hire", module: "hire" },
  leave: { path: "/leave", module: "leave" },
  payroll: { path: "/payroll-module", module: "payroll" },
  branches: { path: "/branches", module: "branches" },
  employees: { path: "/employees", module: "employees" },
  onboarding: { path: "/onboarding", module: "onboarding" },
  offboard: { path: "/offboard", module: "offboard" },
  finance: { path: "/finance", module: "finance" },
  it_management: { path: "/it-management", module: "it-management" },
  benefits: { path: "/benefits", module: "benefits" },
  tools: { path: "/tools", module: "tools" },
};
