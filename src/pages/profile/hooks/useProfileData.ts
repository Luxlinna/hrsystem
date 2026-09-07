import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";
import type { MyEmployee, DirectReport } from "../types";

export function useProfileData() {
  const { user } = useAuth();
  const { role, loading: roleLoading, can } = usePermissions();

  const [displayName, setDisplayName] = useState(
    (user?.user_metadata?.display_name as string) || ""
  );
  const [employee, setEmployee] = useState<MyEmployee | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const isPhone = isPhoneSyntheticEmail(user.email);
      const cleanPhone = isPhone ? syntheticEmailToPhone(user.email) : null;

      let empQuery = supabase
        .from("employees")
        .select(
          "id, first_name, last_name, role, department, status, join_date, phone, reports_to, branches(name), email"
        );

      if (isPhone && cleanPhone) {
        empQuery = empQuery.or(`email.eq.${user.email},phone.eq.${cleanPhone},phone.eq.0${cleanPhone}`);
      } else {
        empQuery = empQuery.eq("email", user.email);
      }

      const { data: rows } = await empQuery.is("deleted_at", null).limit(5);

      let myEmp: MyEmployee | null = null;
      if (rows && rows.length > 0) {
        if (isPhone) {
          myEmp = (rows.find((r: any) => !r.email || isPhoneSyntheticEmail(r.email)) || rows[0]) as unknown as MyEmployee;
        } else {
          myEmp = (rows.find((r: any) => r.email?.toLowerCase() === user.email.toLowerCase()) || rows[0]) as unknown as MyEmployee;
        }
      }
      setEmployee(myEmp);
      setPhone(myEmp?.phone || (cleanPhone ? formatDisplayPhone(cleanPhone) : ""));

      // Sync display name from employees table (HR database is source of truth)
      if (myEmp?.first_name || myEmp?.last_name) {
        const hrName = [myEmp.first_name, myEmp.last_name].filter(Boolean).join(" ");
        setDisplayName(hrName);
      }

      if (myEmp?.reports_to) {
        const { data: mgr } = await supabase
          .from("employees")
          .select("first_name, last_name")
          .eq("id", myEmp.reports_to)
          .maybeSingle();
        if (mgr) setManagerName(`${mgr.first_name} ${mgr.last_name}`);
      }

      if (myEmp?.id) {
        const { data: reports } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, avatar_url")
          .eq("reports_to", myEmp.id)
          .order("first_name");
        setDirectReports((reports as DirectReport[]) || []);
      }

      setEmployeeLoading(false);
    })();
  }, [user?.email]);

  return {
    user,
    role,
    roleLoading,
    can,
    displayName,
    setDisplayName,
    employee,
    setEmployee,
    employeeLoading,
    managerName,
    directReports,
    phone,
    setPhone,
  };
}
