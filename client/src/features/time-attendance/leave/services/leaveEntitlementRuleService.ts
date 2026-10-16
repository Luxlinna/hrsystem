import { supabase } from "@/lib/supabase";

export interface LeaveEntitlementRule {
  id: string;
  code: string;
  name: string;
  leave_type_codes: string[];
  total_employee?: number;
  remark: string;
  status: "Active" | "Disabled";
  target_criteria?: {
    type: "nationality" | "contract" | "department" | "all";
    values: string[];
  };
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_ENTITLEMENT_RULES: Omit<LeaveEntitlementRule, "created_at" | "updated_at">[] = [
  {
    id: "rule-expat",
    code: "Expat",
    name: "Expatriate Entitlement Rule",
    leave_type_codes: ["AL", "SL", "SP", "ML", "CL"],
    total_employee: 3,
    remark: "For expatriates only",
    status: "Active",
    target_criteria: {
      type: "nationality",
      values: ["Expat", "Foreigner", "Non-Cambodian"],
    },
  },
  {
    id: "rule-local",
    code: "Local",
    name: "Local Employee Entitlement Rule",
    leave_type_codes: ["AL", "SL", "SP", "ML", "CL"],
    total_employee: 130,
    remark: "Applicable for all Cambodian employees",
    status: "Active",
    target_criteria: {
      type: "nationality",
      values: ["Khmer", "Cambodian", "Local"],
    },
  },
];

/**
 * 100% Database-driven Fetch (No localStorage)
 * Fetches all entitlement rules directly from Supabase PostgreSQL.
 * If the table is empty, auto-seeds default rules into the database and returns them.
 */
export async function fetchLeaveEntitlementRules(): Promise<LeaveEntitlementRule[]> {
  const { data, error } = await supabase
    .from("leave_entitlement_rules")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching leave entitlement rules from DB:", error);
    return [];
  }

  // If table is empty, auto-seed defaults directly into database
  if (!data || data.length === 0) {
    console.info("leave_entitlement_rules table is empty. Auto-seeding defaults into DB...");
    const { data: seeded, error: seedError } = await supabase
      .from("leave_entitlement_rules")
      .upsert(
        DEFAULT_ENTITLEMENT_RULES.map((r) => ({
          ...r,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      )
      .select("*")
      .order("created_at", { ascending: true });

    if (!seedError && seeded) {
      return seeded as LeaveEntitlementRule[];
    }
  }

  return (data || []) as LeaveEntitlementRule[];
}

/**
 * 100% Database-driven Upsert (No localStorage)
 * Saves or updates a rule directly into the database.
 */
export async function upsertLeaveEntitlementRule(
  item: Omit<LeaveEntitlementRule, "id"> & { id?: string }
): Promise<LeaveEntitlementRule | null> {
  const payload = {
    id: item.id || `rule-${Date.now()}`,
    code: item.code.trim(),
    name: item.name?.trim() || item.code.trim(),
    leave_type_codes: item.leave_type_codes || [],
    total_employee: item.total_employee ?? 0,
    remark: item.remark || "",
    status: item.status || "Active",
    target_criteria: item.target_criteria || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("leave_entitlement_rules")
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error("Failed to upsert leave entitlement rule to database:", error);
    throw new Error(error.message);
  }

  return data as LeaveEntitlementRule;
}

/**
 * 100% Database-driven Delete (No localStorage)
 * Deletes a rule directly from the database.
 */
export async function deleteLeaveEntitlementRule(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("leave_entitlement_rules")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete leave entitlement rule from database:", error);
    throw new Error(error.message);
  }

  return true;
}

/**
 * 100% Database-driven Status Toggle (No localStorage)
 * Toggles Active / Disabled directly in the database.
 */
export async function toggleLeaveEntitlementRuleStatus(
  id: string
): Promise<LeaveEntitlementRule | null> {
  // Query current status from database
  const { data: current, error: fetchErr } = await supabase
    .from("leave_entitlement_rules")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchErr || !current) {
    console.error("Failed to fetch rule for status toggle:", fetchErr);
    return null;
  }

  const nextStatus: "Active" | "Disabled" =
    current.status === "Active" ? "Disabled" : "Active";

  const { data: updated, error: updateErr } = await supabase
    .from("leave_entitlement_rules")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    console.error("Failed to update status in database:", updateErr);
    throw new Error(updateErr.message);
  }

  return updated as LeaveEntitlementRule;
}
