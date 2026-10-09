import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DEPARTMENTS } from "@/features/workforce/employees/constants";

export function useComplaintOrgData(branchId?: string | null) {
  const [buDepartments, setBuDepartments] = useState<string[]>(DEPARTMENTS);
  const [buDivisions, setBuDivisions] = useState<string[]>([
    "IT Division",
    "HR Division",
    "Finance Division",
    "Operations Division",
    "Executive",
  ]);

  useEffect(() => {
    let cancelled = false;

    // Load divisions from Org page table
    supabase
      .from("divisions")
      .select("name")
      .is("deleted_at", null)
      .order("name")
      .then(({ data }) => {
        if (!cancelled && data && data.length > 0) {
          const divs = Array.from(new Set(data.map((d) => d.name).filter(Boolean)));
          if (divs.length > 0) setBuDivisions(divs);
        }
      });

    // Load departments from Org page table
    supabase
      .from("departments")
      .select("name")
      .is("deleted_at", null)
      .order("name")
      .then(({ data }) => {
        if (!cancelled && data && data.length > 0) {
          const depts = Array.from(new Set([...data.map((d) => d.name).filter(Boolean), ...DEPARTMENTS]));
          if (depts.length > 0) setBuDepartments(depts);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [branchId]);

  return { buDepartments, buDivisions };
}
