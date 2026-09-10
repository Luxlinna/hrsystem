import { supabase } from "@/lib/supabase";

export interface RecipientInfo {
  userId: string | null;
  employeeId?: string | null;
  name: string;
  email?: string | null;
  role?: string | null;
}

/**
 * Resolves the Supabase Auth user_id for an employee using email, phone, or employee ID
 */
export async function resolveUserIdForEmployee(empIdentifier: {
  employeeId?: string | null;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
}): Promise<string | null> {
  try {
    const searchConditions: string[] = [];
    if (empIdentifier.email?.trim()) {
      searchConditions.push(`email.ilike.${empIdentifier.email.trim()}`);
    }
    if (empIdentifier.phone?.trim()) {
      const cleanPhone = empIdentifier.phone.replace(/[^0-9]/g, "");
      if (cleanPhone) {
        searchConditions.push(`email.ilike.${cleanPhone}@phone.hrmsystem.local`);
      }
    }
    if (empIdentifier.name?.trim()) {
      searchConditions.push(`display_name.ilike.%${empIdentifier.name.trim()}%`);
    }

    if (searchConditions.length > 0) {
      const { data: uraList } = await supabase
        .from("user_role_assignments")
        .select("user_id")
        .or(searchConditions.join(","))
        .limit(1);

      if (uraList && uraList.length > 0 && uraList[0].user_id) {
        return uraList[0].user_id;
      }
    }

    if (empIdentifier.employeeId) {
      const { data: emp } = await supabase
        .from("employees")
        .select("email, phone")
        .eq("id", empIdentifier.employeeId)
        .maybeSingle();

      if (emp?.email) {
        const { data: ura } = await supabase
          .from("user_role_assignments")
          .select("user_id")
          .ilike("email", emp.email.trim())
          .limit(1)
          .maybeSingle();
        if (ura?.user_id) return ura.user_id;
      }
    }
    return null;
  } catch (err) {
    console.error("resolveUserIdForEmployee error:", err);
    return null;
  }
}

/**
 * Finds the default active recruiter in the company (from HR Division or Recruiter role)
 */
export async function getDefaultRecruiter(): Promise<{ id: string; name: string; email?: string } | null> {
  try {
    const { data: branches } = await supabase
      .from("branches")
      .select("id, name")
      .is("deleted_at", null);

    const hrBranchIds = new Set(
      (branches || [])
        .filter((b) => /hr\s*division|human\s*resource/i.test(b.name))
        .map((b) => b.id)
    );

    const { data: employees } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email, role, department, branch_id")
      .is("deleted_at", null)
      .order("first_name");

    if (!employees || employees.length === 0) return null;

    const hrRecruiters = employees.filter((e) => {
      if (e.branch_id && hrBranchIds.has(e.branch_id)) return true;
      const role = (e.role || "").toLowerCase();
      const dept = (e.department || "").toLowerCase();
      return (
        /(recruiter|recruitment|talent|hr\s*manager|hr\s*officer|hr)/i.test(role) ||
        /(recruitment|talent|hr)/i.test(dept)
      );
    });

    const chosen = hrRecruiters[0] || employees[0];
    return {
      id: chosen.id,
      name: `${chosen.first_name || ""} ${chosen.last_name || ""}`.trim(),
      email: chosen.email || undefined,
    };
  } catch (err) {
    console.error("getDefaultRecruiter error:", err);
    return null;
  }
}
