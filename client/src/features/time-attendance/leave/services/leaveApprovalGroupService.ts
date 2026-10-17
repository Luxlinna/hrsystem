import { supabase } from "@/lib/supabase";

export interface LeaveApprovalFlowStep {
  id: string;
  conditionPrefix?: "OR" | "AND" | "" | string;
  approvalCondition?: "AND" | "OR";
  flowTitle: string;
  flowType: "Employee" | "Role" | "Manager" | "Supervisor" | string;
  description: string;
  condition: string;
  step: number;
  expiredHours?: string | number;
  displayInPrint: boolean;
}

export interface LeaveApprovalFlowGroup {
  id: string;
  flowName: string;
  sortOrder: number;
  businessUnit?: string[];
  site: string[];
  department: string[];
  position?: string[];
  designation?: string[];
  employeeType: string[];
  steps?: LeaveApprovalFlowStep[];
  approverSteps?: import("./leaveApprovalFlowService").ApproverStepConfig[];
  createdAt?: string;
  updatedAt?: string;
}

const STORAGE_KEY = "hrsystem_leave_approval_flow_groups";
export const STEPS_STORAGE_PREFIX = "hrsystem_leave_approval_table_steps";

export const DEFAULT_UNI_TABLE_STEPS: LeaveApprovalFlowStep[] = [
  {
    id: "step-uni-1",
    conditionPrefix: "",
    approvalCondition: "AND",
    flowTitle: "Notified to",
    flowType: "Head of Department",
    description: "Mrs. Chea Tiengchanvathna",
    condition: ">=0",
    step: 1,
    expiredHours: "",
    displayInPrint: true,
  },
  {
    id: "step-uni-2",
    conditionPrefix: "AND",
    approvalCondition: "AND",
    flowTitle: "Notified to",
    flowType: "Head of Division Director",
    description: "Mr. Chey Tola",
    condition: ">=0",
    step: 2,
    expiredHours: "",
    displayInPrint: true,
  },
  {
    id: "step-uni-3",
    conditionPrefix: "CC",
    approvalCondition: "AND",
    flowTitle: "Notified to",
    flowType: "HR Department",
    description: "Mr. Thorng Dararithy",
    condition: ">=0",
    step: 3,
    expiredHours: "",
    displayInPrint: true,
  },
];

export const DEFAULT_SAMPLE_STEPS: LeaveApprovalFlowStep[] = DEFAULT_UNI_TABLE_STEPS;

export const DEFAULT_FIRST_FLOW_GROUP: LeaveApprovalFlowGroup = {
  id: "group-1792143481976",
  flowName: "First Flow",
  sortOrder: 1,
  businessUnit: ["UNI Holding"],
  site: ["UNI Building"],
  department: ["ADMIN & FINANCE"],
  position: ["All"],
  designation: ["All"],
  employeeType: ["All"],
  steps: DEFAULT_UNI_TABLE_STEPS,
};

export const DEFAULT_LEAVE_APPROVAL_GROUPS: LeaveApprovalFlowGroup[] = [
  DEFAULT_FIRST_FLOW_GROUP,
];

/**
 * Converts legacy ApproverStepConfig[] to table-based LeaveApprovalFlowStep[]
 */
export function convertApproverConfigsToTableSteps(
  configs: any[]
): LeaveApprovalFlowStep[] {
  const result: LeaveApprovalFlowStep[] = [];
  if (!Array.isArray(configs)) return result;

  for (const step of configs) {
    const approvers = step.approvers || [];
    for (let i = 0; i < approvers.length; i++) {
      const app = approvers[i];
      const isFirstRow = result.length === 0;
      result.push({
        id: `step-${step.id || step.stepNumber || 1}-${app.id || i}`,
        conditionPrefix: isFirstRow ? "" : (step.condition || "AND"),
        approvalCondition: (step.condition as "AND" | "OR") || "AND",
        flowTitle: "Notified to",
        flowType: "Employee",
        description: app.name || "Approver",
        condition: ">=0",
        step: step.stepNumber || 1,
        expiredHours: "",
        displayInPrint: true,
      });
    }
  }
  return result;
}

/**
 * Converts table-based LeaveApprovalFlowStep[] to ApproverStepConfig[] for system-wide compatibility
 */
export function convertTableStepsToApproverConfigs(
  tableSteps: LeaveApprovalFlowStep[]
): any[] {
  if (!Array.isArray(tableSteps) || tableSteps.length === 0) return [];

  const byStep = new Map<number, LeaveApprovalFlowStep[]>();
  for (const st of tableSteps) {
    const sNum = st.step || 1;
    if (!byStep.has(sNum)) byStep.set(sNum, []);
    byStep.get(sNum)!.push(st);
  }

  const result: any[] = [];
  for (const [stepNum, steps] of byStep.entries()) {
    const condition = steps.length > 1 && steps[1].approvalCondition ? steps[1].approvalCondition : "AND";
    result.push({
      id: `step-${stepNum}`,
      stepNumber: stepNum,
      stepTitle: `Step ${stepNum}`,
      condition: condition as "AND" | "OR",
      approvers: steps.map((s, idx) => ({
        id: s.id || `app-${idx}`,
        name: s.description,
        role: s.flowType === "Employee" ? "Approver" : s.flowType,
      })),
    });
  }
  return result;
}

// ---------------------------------------------------------------------
// 1. Table steps: Synchronous storage + Supabase Database persistence
// ---------------------------------------------------------------------

/**
 * Retrieve approval flow steps by BU / Unit itself, dynamically checking:
 * 1. Specific BU table steps in localStorage (including empty [] if user deleted them)
 * 2. Previous approval flow data set for this BU in localStorage (legacy format)
 * 3. Default UNI Holding data if unit is UNI Holding and no configuration exists
 * 4. Empty array for any other BU (so each BU works by itself without copying others)
 */
export function getStoredTableSteps(unitId?: string, unitName?: string): LeaveApprovalFlowStep[] {
  try {
    // 1. Specific BU table steps in localStorage
    if (unitId) {
      const raw = localStorage.getItem(`${STEPS_STORAGE_PREFIX}_${unitId}`);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }
    if (unitName) {
      const raw = localStorage.getItem(`${STEPS_STORAGE_PREFIX}_${unitName.trim().toLowerCase()}`);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    }

    // 2. Previous approval data set for this BU (hrsystem_leave_approver_flows_...)
    const LEGACY_KEY = "hrsystem_leave_approver_flows";
    if (unitId) {
      const legacyRaw = localStorage.getItem(`${LEGACY_KEY}_${unitId}`);
      if (legacyRaw !== null) {
        const legacyParsed = JSON.parse(legacyRaw);
        const converted = convertApproverConfigsToTableSteps(legacyParsed);
        if (Array.isArray(converted)) {
          return converted;
        }
      }
    }
    if (unitName) {
      const legacyRaw = localStorage.getItem(`${LEGACY_KEY}_${unitName.trim().toLowerCase()}`);
      if (legacyRaw !== null) {
        const legacyParsed = JSON.parse(legacyRaw);
        const converted = convertApproverConfigsToTableSteps(legacyParsed);
        if (Array.isArray(converted)) {
          return converted;
        }
      }
    }

    // 3. If UNI Holding, return UNI Holding's default steps if no setting exists
    const isUni =
      !unitName ||
      /uni|holding|noble/i.test(unitName) ||
      unitId === "cf4826f4-c8ee-4e58-a27d-1b4481eb91f7";

    if (isUni) {
      const globalRaw = localStorage.getItem(STEPS_STORAGE_PREFIX);
      if (globalRaw !== null) {
        const parsed = JSON.parse(globalRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasStale = parsed.some(
            (p) => p.flowType === "Employee" || p.description === "Chea Tiengchanvathna"
          );
          if (!hasStale) {
            return parsed;
          }
        }
      }
      return DEFAULT_UNI_TABLE_STEPS;
    }

    // 4. For any other BU / site, it works by BU itself!
    return [];
  } catch {
    // fallback
  }
  return [];
}

export function saveStoredTableSteps(steps: LeaveApprovalFlowStep[], unitId?: string, unitName?: string): boolean {
  try {
    const legacyConfigs = convertTableStepsToApproverConfigs(steps);

    if (unitId) {
      localStorage.setItem(`${STEPS_STORAGE_PREFIX}_${unitId}`, JSON.stringify(steps));
      localStorage.setItem(`hrsystem_leave_approver_flows_${unitId}`, JSON.stringify(legacyConfigs));
    }
    if (unitName) {
      localStorage.setItem(`${STEPS_STORAGE_PREFIX}_${unitName.trim().toLowerCase()}`, JSON.stringify(steps));
      localStorage.setItem(`hrsystem_leave_approver_flows_${unitName.trim().toLowerCase()}`, JSON.stringify(legacyConfigs));
    }
    if (!unitId || unitId === "cf4826f4-c8ee-4e58-a27d-1b4481eb91f7") {
      localStorage.setItem(STEPS_STORAGE_PREFIX, JSON.stringify(steps));
    }
    window.dispatchEvent(
      new CustomEvent("leave_approval_table_steps_updated", { detail: { steps, unitId, unitName } })
    );
    window.dispatchEvent(
      new CustomEvent("leave_approver_flow_updated", { detail: { branchId: unitId, branchName: unitName } })
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetch approval flow steps dynamically from Supabase PostgreSQL database
 */
export async function fetchLeaveApprovalFlowFromDb(
  unitId?: string,
  unitName?: string
): Promise<LeaveApprovalFlowStep[] | null> {
  try {
    if (!unitId && !unitName) return null;

    let query = supabase.from("leave_approval_flows").select("*");
    if (unitId) {
      query = query.eq("unit_id", unitId);
    } else if (unitName) {
      query = query.eq("unit_name", unitName);
    }

    const { data, error } = await query.maybeSingle();
    if (!error && data && Array.isArray(data.steps)) {
      const steps = data.steps as LeaveApprovalFlowStep[];
      // Update local cache even if empty array []
      saveStoredTableSteps(steps, unitId, unitName);
      return steps;
    }
  } catch (err) {
    console.warn("Failed to fetch leave approval flow from database:", err);
  }
  return null;
}

/**
 * Save approval flow steps dynamically to Supabase PostgreSQL database
 */
export async function saveLeaveApprovalFlowToDb(
  steps: LeaveApprovalFlowStep[],
  unitId: string,
  unitName: string,
  isSite: boolean = false
): Promise<boolean> {
  // Always update local cache first
  saveStoredTableSteps(steps, unitId, unitName);

  try {
    const flowId = `flow-${unitId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const payload = {
      id: flowId,
      unit_id: unitId,
      unit_name: unitName,
      is_site: Boolean(isSite),
      flow_name: `${unitName} Approval Flow`,
      steps: steps,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("leave_approval_flows").upsert(payload, {
      onConflict: "unit_id",
    });

    if (error) {
      console.warn("Error upserting leave_approval_flows to database:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exception saving leave_approval_flows to database:", err);
    return false;
  }
}

// ---------------------------------------------------------------------
// 2. Custom Flow Groups: Synchronous storage + Supabase Database persistence
// ---------------------------------------------------------------------

export function getLeaveApprovalGroups(): LeaveApprovalFlowGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out any stale mock CKOP_AREA 2 previously cached in browser
        const cleaned = parsed.filter(
          (g) => g.id !== "group-ckop-area-2" && g.flowName?.toLowerCase() !== "ckop_area 2"
        );
        if (cleaned.length !== parsed.length) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
          } catch {
            // ignore storage errors
          }
        }
        return cleaned;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_LEAVE_APPROVAL_GROUPS;
}

export function saveLeaveApprovalGroups(groups: LeaveApprovalFlowGroup[]): boolean {
  try {
    const cleaned = groups.filter(
      (g) => g.id !== "group-ckop-area-2" && g.flowName?.toLowerCase() !== "ckop_area 2"
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    window.dispatchEvent(new CustomEvent("leave_approval_groups_updated", { detail: cleaned }));
    return true;
  } catch {
    return false;
  }
}

export function saveLeaveApprovalGroup(group: LeaveApprovalFlowGroup): boolean {
  const all = getLeaveApprovalGroups();
  const index = all.findIndex((g) => g.id === group.id);
  let updated: LeaveApprovalFlowGroup[];
  if (index >= 0) {
    updated = all.map((g) => (g.id === group.id ? { ...group, updatedAt: new Date().toISOString() } : g));
  } else {
    updated = [...all, { ...group, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
  }
  saveLeaveApprovalGroups(updated);
  // Also save in background to Supabase
  saveLeaveApprovalGroupToDb(group).catch(() => {});
  return true;
}

export function deleteLeaveApprovalGroup(groupId: string): boolean {
  const all = getLeaveApprovalGroups();
  const updated = all.filter((g) => g.id !== groupId);
  saveLeaveApprovalGroups(updated);
  // Also delete in background from Supabase
  deleteLeaveApprovalGroupFromDb(groupId).catch(() => {});
  return true;
}

export async function fetchLeaveApprovalGroupsFromDb(): Promise<LeaveApprovalFlowGroup[]> {
  try {
    const { data, error } = await supabase
      .from("leave_approval_groups")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && data) {
      const groups: LeaveApprovalFlowGroup[] = data
        .filter((d: any) => d.id !== "group-ckop-area-2" && d.flow_name?.toLowerCase() !== "ckop_area 2")
        .map((d: any) => ({
          id: d.id,
          flowName: d.flow_name,
          sortOrder: d.sort_order ?? 15,
          businessUnit: d.business_units || [],
          site: d.sites || [],
          department: d.departments || [],
          position: d.positions || [],
          designation: d.positions || [],
          employeeType: d.employee_types || [],
          steps:
            Array.isArray(d.steps) && d.steps.length > 0
              ? d.steps
              : d.flow_name?.toLowerCase() === "first flow" || d.id === "group-1792143481976"
              ? DEFAULT_FIRST_FLOW_GROUP.steps
              : [],
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));

      // Update local cache directly without firing leave_approval_groups_updated event to prevent infinite loops
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
      } catch {
        // ignore storage errors
      }

      return groups;
    }
  } catch (err) {
    console.warn("Failed to fetch leave approval groups from database:", err);
  }
  return getLeaveApprovalGroups();
}

export async function saveLeaveApprovalGroupToDb(group: LeaveApprovalFlowGroup): Promise<boolean> {
  try {
    const payload = {
      id: group.id || `group-${Date.now()}`,
      flow_name: group.flowName,
      sort_order: group.sortOrder ?? 15,
      business_units: group.businessUnit || [],
      sites: group.site || [],
      departments: group.department || [],
      positions: group.position || group.designation || [],
      employee_types: group.employeeType || [],
      steps: group.steps || [],
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("leave_approval_groups").upsert(payload, {
      onConflict: "id",
    });

    if (error) {
      console.warn("Error upserting leave_approval_groups:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exception saving leave_approval_groups:", err);
    return false;
  }
}

export async function deleteLeaveApprovalGroupFromDb(groupId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("leave_approval_groups").delete().eq("id", groupId);
    if (error) {
      console.warn("Error deleting leave_approval_groups:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Exception deleting leave_approval_groups:", err);
    return false;
  }
}
