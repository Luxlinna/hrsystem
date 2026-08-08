// Maps a notification's `source` (+ optional `entity_id`) to where clicking
// it should go. `system` has no single destination and is omitted on
// purpose — those notifications only get marked read on click.
//
// Where a dedicated detail route exists (hire candidates, employees), we
// link straight to it. Everywhere else is a list page with inline
// expand/collapse per row, so we pass `?highlight=<id>` instead and the
// page itself is responsible for expanding and scrolling to that row.
export function getNotificationTarget(
  source: string,
  entityId?: string | null
): { path: string; module: string } | null {
  const highlight = entityId ? `?highlight=${entityId}` : "";
  switch (source) {
    case "hire":
      return { path: entityId ? `/hire/candidate/${entityId}` : "/hire", module: "hire" };
    case "leave":
      return { path: `/leave${highlight}`, module: "leave" };
    // All current "payroll" notifications come from the Payroll Approval
    // workflow (run submitted/approved/rejected/processed) — route there,
    // not to the separate per-employee payroll records page.
    case "payroll":
      return { path: `/payroll-approval${highlight}`, module: "payroll-approval" };
    case "branches":
      return { path: "/branches", module: "branches" };
    case "employees":
      return { path: entityId ? `/employees/${entityId}` : "/employees", module: "employees" };
    case "onboarding":
      return { path: `/onboarding${highlight}`, module: "onboarding" };
    case "offboard":
      return { path: `/offboard${highlight}`, module: "offboard" };
    case "finance":
      return { path: "/finance", module: "finance" };
    case "it_management":
      return { path: `/it-management${highlight}`, module: "it-management" };
    case "benefits":
      return { path: "/benefits", module: "benefits" };
    case "tools":
      return { path: "/tools", module: "tools" };
    default:
      return null;
  }
}
