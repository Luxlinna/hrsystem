import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Branch } from "../types";

export function useBranchesData() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBranches = useCallback(async () => {
    const [branchesRes, empRes, profileSettingsRes] = await Promise.all([
      supabase
        .from("branches")
        .select("*")
        .is("deleted_at", null),
      supabase
        .from("employees")
        .select("id, branch_id, status")
        .is("deleted_at", null),
      supabase
        .from("system_settings")
        .select("key, value")
        .ilike("key", "bu_profile_%"),
    ]);

    const branchesList: Branch[] = branchesRes.data || [];
    const employeesList = empRes.data || [];

    // Parse backup profile settings from system_settings
    const profileMap: Record<string, any> = {};
    if (profileSettingsRes.data) {
      for (const item of profileSettingsRes.data) {
        try {
          const branchId = item.key.replace("bu_profile_", "");
          profileMap[branchId] = JSON.parse(item.value);
        } catch (_e) {
          // ignore corrupted JSON
        }
      }
    }

    // Map actual employees count per branch from the employees table
    const countMap: Record<string, number> = {};
    for (const emp of employeesList) {
      if (emp.branch_id) {
        countMap[emp.branch_id] = (countMap[emp.branch_id] || 0) + 1;
      }
    }

    const calculatedBranches = branchesList.map((branch) => {
      const profile = profileMap[branch.id] || {};
      return {
        ...branch,
        // 1. Company Info
        logo_url: branch.logo_url ?? profile.logo_url ?? null,
        company_name: branch.company_name ?? profile.company_name ?? branch.name ?? null,
        registration_no: branch.registration_no ?? profile.registration_no ?? null,
        vat_no: branch.vat_no ?? profile.vat_no ?? null,
        industry: branch.industry ?? profile.industry ?? null,
        currency: branch.currency ?? profile.currency ?? "USD",
        rounding_digit: branch.rounding_digit ?? profile.rounding_digit ?? 2,

        // 2. Physical Address Info
        physical_address: branch.physical_address ?? profile.physical_address ?? branch.location ?? null,
        physical_city: branch.physical_city ?? profile.physical_city ?? "Phnom Penh",
        physical_province: branch.physical_province ?? profile.physical_province ?? null,
        physical_postal_code: branch.physical_postal_code ?? profile.physical_postal_code ?? null,
        physical_country: branch.physical_country ?? profile.physical_country ?? "Cambodia",

        // 3. Mailing Address Info
        mailing_address: branch.mailing_address ?? profile.mailing_address ?? branch.physical_address ?? branch.location ?? null,
        mailing_city: branch.mailing_city ?? profile.mailing_city ?? "Phnom Penh",
        mailing_province: branch.mailing_province ?? profile.mailing_province ?? null,
        mailing_postal_code: branch.mailing_postal_code ?? profile.mailing_postal_code ?? null,
        mailing_country: branch.mailing_country ?? profile.mailing_country ?? "Cambodia",

        // 4. Contact Info
        phone_number: branch.phone_number ?? profile.phone_number ?? null,
        email: branch.email ?? profile.email ?? null,
        website: branch.website ?? profile.website ?? null,

        // 5. Legal Info
        legal_tax_number: branch.legal_tax_number ?? profile.legal_tax_number ?? null,
        legal_name: branch.legal_name ?? profile.legal_name ?? null,
        legal_business_activity: branch.legal_business_activity ?? profile.legal_business_activity ?? null,
        legal_address: branch.legal_address ?? profile.legal_address ?? null,
        legal_phone_number: branch.legal_phone_number ?? profile.legal_phone_number ?? null,
        legal_email: branch.legal_email ?? profile.legal_email ?? null,

        employee_count: countMap[branch.id] ?? 0,
      };
    });

    // Sort by employee count descending, then by name
    calculatedBranches.sort(
      (a, b) => (b.employee_count - a.employee_count) || a.name.localeCompare(b.name)
    );

    setBranches(calculatedBranches);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadBranches();
    const channel = supabase
      .channel("branches-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, () => loadBranches())
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => loadBranches())
      .on("postgres_changes", { event: "*", schema: "public", table: "system_settings" }, () => loadBranches())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBranches]);

  return {
    branches,
    setBranches,
    loading,
    loadBranches,
  };
}
