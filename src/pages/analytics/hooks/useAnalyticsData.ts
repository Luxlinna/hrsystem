import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type {
  BenefitEnrollment,
  BenefitPlan,
  Candidate,
  Employee,
  ExpenseRecord,
  ITAsset,
  ITTicket,
  JobPosting,
  LeaveRequest,
  OffboardingRequest,
  PayrollRecord,
} from "../types";

export function useAnalyticsData() {
  const { isSuperAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [offboarding, setOffboarding] = useState<OffboardingRequest[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [itAssets, setItAssets] = useState<ITAsset[]>([]);
  const [itTickets, setItTickets] = useState<ITTicket[]>([]);
  const [benefitEnrollments, setBenefitEnrollments] = useState<BenefitEnrollment[]>([]);
  const [benefitPlans, setBenefitPlans] = useState<BenefitPlan[]>([]);

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setEmployees([]);
      setLeaveRequests([]);
      setPayroll([]);
      setJobs([]);
      setCandidates([]);
      setOffboarding([]);
      setExpenses([]);
      setItAssets([]);
      setItTickets([]);
      setBenefitEnrollments([]);
      setBenefitPlans([]);
      return;
    }

    const empQuery = supabase
      .from("employees")
      .select("id, first_name, last_name, department, role, status, join_date, branch_id")
      .eq("branch_id", targetBranch)
      .eq("status", "active")
      .is("deleted_at", null);

    const expQuery = supabase
      .from("expense_records")
      .select("id, category, amount, status, date, branch_id, submitted_by")
      .is("deleted_at", null)
      .or(`branch_id.eq.${targetBranch},branch_id.is.null`);

    const results = await Promise.all([
      empQuery,
      supabase.from("leave_requests").select("id, employee_id, leave_type, start_date, end_date, days, status, employees(branch_id)"),
      supabase.from("payroll_records").select("employee_id, month, base_salary, bonus, deductions, net_pay, status, employees(branch_id)"),
      supabase.from("job_postings").select("id, title, department, status, location, salary_min, salary_max").is("deleted_at", null).eq("branch_id", targetBranch),
      supabase.from("candidates").select("id, stage, applied_at, job_posting_id, job_postings(id, department, branch_id)").is("deleted_at", null),
      supabase.from("offboarding_requests").select("id, employee_id, reason, status, last_day, employees(branch_id)"),
      expQuery,
      supabase.from("it_assets").select("id, type, status, employee_id, branch_id, employees(branch_id)").is("deleted_at", null).or(`branch_id.eq.${targetBranch},branch_id.is.null`),
      supabase.from("it_tickets").select("id, priority, status, category, branch_id, created_at").is("deleted_at", null).or(`branch_id.eq.${targetBranch},branch_id.is.null`),
      supabase.from("benefit_enrollments").select("id, employee_id, plan_id, status, employees(branch_id)"),
      supabase.from("benefit_plans").select("id, name, type"),
    ]);

    const empList = (results[0].data || []) as Employee[];
    const empIds = new Set(empList.map((e) => e.id));
    const rawJobs = (results[3].data || []) as JobPosting[];
    const jobIds = new Set(rawJobs.map((j) => j.id));

    const rawCandidates = (results[4].data || []) as any[];
    const formattedCandidates: Candidate[] = rawCandidates
      .map((c) => {
        const jp = Array.isArray(c.job_postings) ? c.job_postings[0] : c.job_postings;
        return {
          id: c.id,
          stage: c.stage,
          applied_at: c.applied_at,
          job_posting_id: c.job_posting_id,
          department: jp?.department || "Unassigned",
        };
      })
      .filter((c) => !c.job_posting_id || jobIds.has(c.job_posting_id));

    setEmployees(empList);
    setLeaveRequests((results[1].data || []).filter((l: any) => empIds.has(l.employee_id) || l.employees?.branch_id === targetBranch));
    setPayroll((results[2].data || []).filter((p: any) => empIds.has(p.employee_id) || p.employees?.branch_id === targetBranch));
    setJobs(rawJobs);
    setCandidates(formattedCandidates);
    setOffboarding((results[5].data || []).filter((o: any) => empIds.has(o.employee_id) || o.employees?.branch_id === targetBranch));
    setExpenses((results[6].data || []) as ExpenseRecord[]);
    setItAssets(
      (results[7].data || [])
        .map((a: any) => ({
          ...a,
          assigned_to: a.employee_id || a.assigned_to || null,
        }))
        .filter((a: any) => !a.employee_id || empIds.has(a.employee_id) || a.employees?.branch_id === targetBranch)
    );
    setItTickets(results[8].data || []);
    setBenefitEnrollments((results[9].data || []).filter((b: any) => empIds.has(b.employee_id) || b.employees?.branch_id === targetBranch));
    setBenefitPlans(results[10].data || []);
  }, [isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    loadData();
    const ch = supabase.channel("analytics-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, loadData)
      .on("postgres_changes", { event: "*", schema: "public", table: "payroll_records" }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadData]);

  return {
    isSuperAdmin,
    effectiveBranchId,
    userBranchId,
    userBranchName,
    targetBranch,
    isPartnerBranchBlocked,
    employees,
    leaveRequests,
    payroll,
    jobs,
    candidates,
    offboarding,
    expenses,
    itAssets,
    itTickets,
    benefitEnrollments,
    benefitPlans,
  };
}
