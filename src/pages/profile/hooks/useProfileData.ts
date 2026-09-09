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
          `id, first_name, last_name, role, department, status, join_date, phone, reports_to, branches(name), email,
           location, education, work_experience, skills, languages, expected_salary, notice_period, resume_url, resume_name,
           candidate_code, candidate_id`
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

      if (myEmp) {
        // Query candidate master record if linked by ID, email, or phone
        try {
          let candQuery = null;
          if (myEmp.candidate_id) {
            candQuery = supabase
              .from("candidates")
              .select("*, assigned_recruiter:assigned_recruiter_id(first_name, last_name)")
              .eq("id", myEmp.candidate_id)
              .maybeSingle();
          } else if (myEmp.candidate_code) {
            candQuery = supabase
              .from("candidates")
              .select("*, assigned_recruiter:assigned_recruiter_id(first_name, last_name)")
              .eq("candidate_code", myEmp.candidate_code)
              .maybeSingle();
          } else if (user.email && !isPhone) {
            candQuery = supabase
              .from("candidates")
              .select("*, assigned_recruiter:assigned_recruiter_id(first_name, last_name)")
              .eq("email", user.email)
              .maybeSingle();
          } else if (myEmp.phone) {
            candQuery = supabase
              .from("candidates")
              .select("*, assigned_recruiter:assigned_recruiter_id(first_name, last_name)")
              .eq("phone", myEmp.phone)
              .maybeSingle();
          }

          if (candQuery) {
            const { data: cand } = await candQuery;
            if (cand) {
              const recruiterName = cand.assigned_recruiter
                ? `${cand.assigned_recruiter.first_name || ""} ${cand.assigned_recruiter.last_name || ""}`.trim()
                : null;

              const { data: apps } = await supabase
                .from("candidate_applications")
                .select("*, job_posting:job_postings(title, department)")
                .eq("candidate_id", cand.id)
                .order("applied_at", { ascending: false });

              myEmp = {
                ...myEmp,
                candidate_id: cand.id,
                candidate_code: myEmp.candidate_code || cand.candidate_code,
                location: myEmp.location || cand.location || null,
                education: myEmp.education || cand.education || null,
                work_experience: myEmp.work_experience || cand.work_experience || null,
                skills: (myEmp.skills && myEmp.skills.length > 0) ? myEmp.skills : (cand.skills || []),
                languages: (myEmp.languages && myEmp.languages.length > 0) ? myEmp.languages : (cand.languages || []),
                expected_salary: myEmp.expected_salary ?? cand.expected_salary ?? null,
                notice_period: myEmp.notice_period || cand.notice_period || null,
                resume_url: myEmp.resume_url || cand.resume_url || null,
                resume_name: myEmp.resume_name || cand.resume_name || null,
                source: cand.source || null,
                assigned_recruiter_name: recruiterName,
                tags: cand.tags || [],
                candidate_notes: cand.notes || null,
                applications: apps || [],
              };

              // If candidate_code was missing on employee, sync it asynchronously
              if (!myEmp.candidate_code && cand.candidate_code) {
                supabase
                  .from("employees")
                  .update({ candidate_code: cand.candidate_code, candidate_id: cand.id })
                  .eq("id", myEmp.id)
                  .then(() => {});
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch candidate master record for profile:", err);
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
