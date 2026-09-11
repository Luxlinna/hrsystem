import { supabase } from "@/lib/supabase";
import type { Candidate, Interview, CandidateApproval } from "../types";
import {
  generateApprovalFormNumber,
  initCandidateApproval,
} from "./candidateApprovalDefaults";
import {
  formatInterviewEndTime,
  extractFeedbackFromInterviews,
  parseInterviewPanelFromNotes,
} from "../utils/interviewPanelHelper";

export { generateApprovalFormNumber, initCandidateApproval };

const LOCAL_STORAGE_KEY = "hrm_candidate_approvals_store";

function getLocalApprovals(): CandidateApproval[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalApprovals(list: CandidateApproval[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore quota errors
  }
}

export interface BuEmployeeOption {
  id: string;
  name: string;
  role: string;
  department: string;
  branch_id?: string;
  branch_name?: string;
}

export async function fetchBuEmployeesForCandidate(
  branchId?: string | null,
  businessUnitName?: string | null
): Promise<BuEmployeeOption[]> {
  try {
    let query = supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, branch_id, branches(name)")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("first_name");

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      const { data: allEmps } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, branch_id, branches(name)")
        .eq("status", "active")
        .is("deleted_at", null)
        .order("first_name");

      if (allEmps && allEmps.length > 0) {
        if (businessUnitName) {
          const matched = allEmps.filter((e) => {
            const bName = (e.branches as any)?.name || "";
            return bName.toLowerCase().includes(businessUnitName.toLowerCase()) ||
                   businessUnitName.toLowerCase().includes(bName.toLowerCase());
          });
          if (matched.length > 0) {
            return matched.map((e) => ({
              id: e.id,
              name: `${e.first_name || ""} ${e.last_name || ""}`.trim(),
              role: e.role || e.department || "Employee",
              department: e.department || "",
              branch_id: e.branch_id,
              branch_name: (e.branches as any)?.name || "",
            }));
          }
        }
        return allEmps.map((e) => ({
          id: e.id,
          name: `${e.first_name || ""} ${e.last_name || ""}`.trim(),
          role: e.role || e.department || "Employee",
          department: e.department || "",
          branch_id: e.branch_id,
          branch_name: (e.branches as any)?.name || "",
        }));
      }
      return [];
    }

    return data.map((e) => ({
      id: e.id,
      name: `${e.first_name || ""} ${e.last_name || ""}`.trim(),
      role: e.role || e.department || "Employee",
      department: e.department || "",
      branch_id: e.branch_id,
      branch_name: (e.branches as any)?.name || "",
    }));
  } catch (err) {
    console.error("Failed to fetch BU employees:", err);
    return [];
  }
}

export async function resolveSignatoryNamesForApproval(
  branchId?: string | null
): Promise<{
  ceo: string;
  hr_manager: string;
  division_director: string;
  chairwoman: string;
}> {
  let ceoName = "";
  let hrManagerName = "";
  let hrDirectorName = "";
  let chairwomanName = "";

  try {
    const [{ data: emps }, { data: uras }] = await Promise.all([
      supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, branch_id, branches(name)")
        .is("deleted_at", null)
        .eq("status", "active"),
      supabase
        .from("user_role_assignments")
        .select("id, user_id, email, display_name, role_id, app_roles(*)")
        .is("deleted_at", null),
    ]);

    // 1. BU CEO (Candidate's branch)
    if (branchId) {
      const branchCeo = emps?.find(
        (e) =>
          e.branch_id === branchId &&
          /(ceo|president|division\s*director|branch\s*admin|bu\s*admin|general\s*manager|admin)/i.test(e.role || "")
      );
      if (branchCeo) ceoName = `${branchCeo.first_name || ""} ${branchCeo.last_name || ""}`.trim();
    }
    if (!ceoName) {
      const ceoUra = uras?.find((u) => {
        const r = u.app_roles as any;
        return /(bu\s*ceo|branch\s*admin)/i.test(r?.name || "") || r?.candidate_approval_ceo_sign;
      });
      if (ceoUra?.display_name) ceoName = ceoUra.display_name.trim();
    }
    if (!ceoName) {
      const ceoEmp = emps?.find((e) => /(ceo|president)/i.test(e.role || ""));
      if (ceoEmp) ceoName = `${ceoEmp.first_name || ""} ${ceoEmp.last_name || ""}`.trim();
    }

    // 2. HR Manager (HR Division)
    const hrUra = uras?.find((u) => {
      const r = u.app_roles as any;
      return /(hr\s*manager|talent\s*manager)/i.test(r?.name || "") || r?.candidate_approval_hr_sign;
    });
    if (hrUra?.display_name) hrManagerName = hrUra.display_name.trim();

    if (!hrManagerName) {
      const hrEmps = emps?.filter((e) => {
        const bName = (e.branches as any)?.name || "";
        return (
          /hr\s*division/i.test(bName) &&
          /(hr\s*manager|manager|hr)/i.test(e.role || "") &&
          !/(director)/i.test(e.role || "")
        );
      });
      const bestHr =
        hrEmps?.find((e) => /manager/i.test(e.role || "")) ||
        hrEmps?.find((e) => /sokkhoeurn/i.test(e.first_name || "")) ||
        hrEmps?.[0];
      if (bestHr) hrManagerName = `${bestHr.first_name || ""} ${bestHr.last_name || ""}`.trim();
    }

    // 3. HR Admin Director (HR Division)
    const dirUra = uras?.find((u) => {
      const r = u.app_roles as any;
      return /(hr.*director|division\s*director)/i.test(r?.name || "") || r?.candidate_approval_director_sign;
    });
    if (dirUra?.display_name) hrDirectorName = dirUra.display_name.trim();

    if (!hrDirectorName) {
      const dirEmp =
        emps?.find((e) => {
          const bName = (e.branches as any)?.name || "";
          return (
            /hr\s*division/i.test(bName) &&
            /(hr.*director|head\s*of\s*hr|director)/i.test(e.role || "")
          );
        }) || emps?.find((e) => /(hr.*director|head\s*of\s*hr)/i.test(e.role || ""));
      if (dirEmp) hrDirectorName = `${dirEmp.first_name || ""} ${dirEmp.last_name || ""}`.trim();
    }

    // 4. Chairwoman
    const chairUra = uras?.find((u) => {
      const r = u.app_roles as any;
      return /(chair|board)/i.test(r?.name || "") || r?.candidate_approval_chairwoman_sign;
    });
    if (chairUra?.display_name) chairwomanName = chairUra.display_name.trim();

    if (!chairwomanName) {
      const chairEmp = emps?.find((e) => /(chair|board)/i.test(e.role || ""));
      if (chairEmp) chairwomanName = `${chairEmp.first_name || ""} ${chairEmp.last_name || ""}`.trim();
    }
  } catch (err) {
    console.error("resolveSignatoryNamesForApproval error:", err);
  }

  return {
    ceo: ceoName || "CEO / Branch Director",
    hr_manager: hrManagerName || "HR Manager",
    division_director: hrDirectorName || "HR Admin Director",
    chairwoman: chairwomanName || "Chairwoman",
  };
}

export async function resolveCandidateRequisitionDetails(
  candidate?: Candidate | null
): Promise<{
  businessUnit: string;
  department: string;
  hiringManager: string;
  currentSalary: string;
  expectationSalary: string;
  noticePeriod: string;
  positionApplied: string;
  branchId: string | null;
}> {
  let businessUnit = "";
  let department = "";
  let hiringManager = "";
  let currentSalary = "";
  let expectationSalary = "";
  let noticePeriod = candidate?.notice_period || "1 Month";
  let positionApplied = candidate?.job_postings?.title || "";
  let branchId = candidate?.job_postings?.branch_id || null;

  const jobId = candidate?.job_posting_id || candidate?.job_postings?.id;

  try {
    let req: any = null;
    let job: any = candidate?.job_postings || null;

    if (jobId) {
      const [{ data: reqData }, { data: jobData }] = await Promise.all([
        supabase
          .from("hiring_requests")
          .select("*, branches(id, name, manager_name)")
          .eq("job_posting_id", jobId)
          .maybeSingle(),
        job?.branches?.name
          ? Promise.resolve({ data: job })
          : supabase
              .from("job_postings")
              .select("*, branches(id, name, manager_name)")
              .eq("id", jobId)
              .maybeSingle(),
      ]);
      req = reqData;
      if (jobData) job = jobData;
    }

    if (req) {
      businessUnit = req.branches?.name || "";
      branchId = branchId || req.branch_id || req.branches?.id || null;
      department = req.department || "";
      hiringManager = req.hiring_manager_name || req.requested_by_name || req.branches?.manager_name || "";
      if (req.salary_min) currentSalary = `$${req.salary_min.toLocaleString()}`;
      if (req.salary_max) expectationSalary = `$${req.salary_max.toLocaleString()}`;
      if (!positionApplied && req.title) positionApplied = req.title;
    }

    if (!businessUnit && job?.branches?.name) {
      businessUnit = job.branches.name;
    }
    if (!branchId && job?.branch_id) {
      branchId = job.branch_id;
    }
    if (!department && job?.department) {
      department = job.department;
    }
    if (!hiringManager) {
      hiringManager =
        candidate?.assigned_recruiter
          ? `${candidate.assigned_recruiter.first_name || ""} ${candidate.assigned_recruiter.last_name || ""}`.trim()
          : job?.branches?.manager_name || "";
    }
    if (!currentSalary && job?.salary_min) {
      currentSalary = `$${job.salary_min.toLocaleString()}`;
    }
    if (!expectationSalary && (candidate?.expected_salary || job?.salary_max)) {
      expectationSalary = `$${(candidate?.expected_salary || job?.salary_max).toLocaleString()}`;
    }
  } catch (err) {
    console.warn("Could not resolve requisition details for candidate approval:", err);
  }

  return {
    businessUnit: businessUnit || "Unique Noble Investment Co. Ltd.",
    department: department || "HR & Operations",
    hiringManager: hiringManager || "Hiring Manager",
    currentSalary: currentSalary || "$1,200",
    expectationSalary: expectationSalary || "$1,500",
    noticePeriod: noticePeriod || "1 Month",
    positionApplied: positionApplied || "Candidate Position",
    branchId,
  };
}

export async function fetchCandidateApproval(
  candidateId: string,
  candidate?: Candidate,
  interviews?: Interview[],
  actorName = "HR Operations"
): Promise<CandidateApproval> {
  const dynamicNames = await resolveSignatoryNamesForApproval(candidate?.job_postings?.branch_id);

  // 1. Try fetching from Supabase (order by updated_at desc and take 1 to avoid PGRST116)
  try {
    const { data: rows, error } = await supabase
      .from("candidate_approvals")
      .select("*")
      .eq("candidate_id", candidateId)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (!error && rows && rows.length > 0) {
      let remote = rows[0] as CandidateApproval;

      // Replace old static placeholder names on unsigned steps
      const staticPlaceholders = ["Ms. Meas Chhengseang", "Ms. Chea TiengChanvathna", "Mr. Chey Tola"];
      const sigs = { ...remote.signatories };
      let changed = false;

      if (sigs.ceo && sigs.ceo.status !== "approved" && staticPlaceholders.includes(sigs.ceo.assigned_name)) {
        sigs.ceo.assigned_name = dynamicNames.ceo;
        changed = true;
      }
      if (sigs.hr_manager && sigs.hr_manager.status !== "approved" && staticPlaceholders.includes(sigs.hr_manager.assigned_name)) {
        sigs.hr_manager.assigned_name = dynamicNames.hr_manager;
        changed = true;
      }
      if (sigs.division_director && sigs.division_director.status !== "approved" && staticPlaceholders.includes(sigs.division_director.assigned_name)) {
        sigs.division_director.assigned_name = dynamicNames.division_director;
        changed = true;
      }

      if (changed) {
        remote = { ...remote, signatories: sigs };
      }

      // Update business_unit, department, and hiring_manager from requisition if currently generic
      const reqDetails = await resolveCandidateRequisitionDetails(candidate);
      let detailsChanged = false;

      const isGenericBu = !remote.business_unit || remote.business_unit === "Unique Noble Investment Co. Ltd.";
      const isGenericHm = !remote.hiring_manager || remote.hiring_manager === "Hiring Manager";
      const isGenericDept = !remote.department || remote.department === "HR & Operations";

      if (isGenericBu && reqDetails.businessUnit && reqDetails.businessUnit !== "Unique Noble Investment Co. Ltd.") {
        remote.business_unit = reqDetails.businessUnit;
        if (reqDetails.branchId) remote.branch_id = reqDetails.branchId;
        detailsChanged = true;
      }
      if (isGenericHm && reqDetails.hiringManager && reqDetails.hiringManager !== "Hiring Manager") {
        remote.hiring_manager = reqDetails.hiringManager;
        detailsChanged = true;
      }
      if (isGenericDept && reqDetails.department && reqDetails.department !== "HR & Operations") {
        remote.department = reqDetails.department;
        detailsChanged = true;
      }

      // Automatically sync completed interview panels to "Signed" with interview end time
      let panelsChanged = false;
      const currentPanels = [...(remote.interview_panels || [])];

      if (interviews && interviews.length > 0) {
        const completedIvs = interviews.filter(
          (iv) => iv.status === "completed" || Boolean(iv.feedback || iv.score)
        );

        if (completedIvs.length > 0) {
          for (const iv of completedIvs) {
            const endTimeFormatted = formatInterviewEndTime(iv.scheduled_at, iv.duration_minutes || 60);
            const { panelMembers } = parseInterviewPanelFromNotes(iv.notes);

            const membersToSync: { name: string; role: string }[] =
              panelMembers.length > 0
                ? panelMembers.map((m) => ({ name: m.name, role: m.role || "Interviewer" }))
                : iv.employees
                ? [
                    {
                      name: `${iv.employees.first_name} ${iv.employees.last_name}`.trim(),
                      role: iv.employees.role || iv.employees.department || "Hiring Manager",
                    },
                  ]
                : [];

            for (const m of membersToSync) {
              const existingIdx = currentPanels.findIndex(
                (p) => p.name.trim().toLowerCase() === m.name.trim().toLowerCase()
              );

              const rawFb = (iv.feedback || "").toLowerCase();
              const cleanMName = m.name.trim().toLowerCase();
              const hasEvaluated =
                !rawFb.includes("[evaluation form:") ||
                rawFb.includes(`evaluator: ${cleanMName}`) ||
                rawFb.includes(cleanMName);

              const signatureVal = hasEvaluated ? "Signed" : "Verified";

              if (existingIdx >= 0) {
                if (hasEvaluated && currentPanels[existingIdx].signature !== "Signed") {
                  currentPanels[existingIdx] = {
                    ...currentPanels[existingIdx],
                    signature: "Signed",
                    date_time: endTimeFormatted,
                  };
                  panelsChanged = true;
                }
              } else {
                currentPanels.push({
                  name: m.name,
                  date_time: endTimeFormatted,
                  position: m.role || "Interviewer",
                  signature: signatureVal,
                });
                panelsChanged = true;
              }
            }
          }

          // Populate evaluator feedback into assessment if generic or empty
          const fbSynthesis = extractFeedbackFromInterviews(interviews);
          const isGenericAssessment =
            !remote.overall_assessment ||
            remote.overall_assessment.includes("Candidate performed exceptionally well across all interview stages");

          if (isGenericAssessment && fbSynthesis.overallAssessment) {
            remote.overall_assessment = fbSynthesis.overallAssessment;
            panelsChanged = true;
          }
          if (!remote.strengths && fbSynthesis.strengths) {
            remote.strengths = fbSynthesis.strengths;
            panelsChanged = true;
          }
          if (!remote.improvement && fbSynthesis.improvement) {
            remote.improvement = fbSynthesis.improvement;
            panelsChanged = true;
          }
        }
      }

      if (panelsChanged) {
        remote.interview_panels = currentPanels;
      }

      if (changed || detailsChanged || panelsChanged) {
        void supabase
          .from("candidate_approvals")
          .update({
            signatories: sigs,
            business_unit: remote.business_unit,
            department: remote.department,
            hiring_manager: remote.hiring_manager,
            branch_id: remote.branch_id,
            interview_panels: remote.interview_panels,
            overall_assessment: remote.overall_assessment,
            strengths: remote.strengths,
            improvement: remote.improvement,
          })
          .eq("id", remote.id)
          .then(null, () => {});
      }

      const local = getLocalApprovals();
      const idx = local.findIndex((a) => a.id === remote.id || a.candidate_id === candidateId);
      if (idx >= 0) {
        local[idx] = remote;
      } else {
        local.unshift(remote);
      }
      setLocalApprovals(local);
      return remote;
    }
  } catch {
    // Fall back to local
  }

  // 2. Initialize fresh if candidate provided
  if (candidate) {
    const local = getLocalApprovals();
    const found = local.find((a) => a.candidate_id === candidateId);
    if (found) {
      void supabase.from("candidate_approvals").upsert(found as any).then(null, () => {});
      return found;
    }

    const reqDetails = await resolveCandidateRequisitionDetails(candidate);
    const fresh = initCandidateApproval(candidate, interviews, actorName, dynamicNames, reqDetails);
    local.unshift(fresh);
    setLocalApprovals(local);

    try {
      await supabase.from("candidate_approvals").upsert(fresh as any);
    } catch {
      // Offline fallback
    }

    return fresh;
  }

  throw new Error("Candidate record required to initialize approval");
}

export async function saveCandidateApproval(
  approval: CandidateApproval
): Promise<CandidateApproval> {
  const now = new Date().toISOString();

  const sigs = approval.signatories;
  const allApproved =
    sigs.ceo.status === "approved" &&
    sigs.hr_manager.status === "approved" &&
    sigs.division_director.status === "approved" &&
    sigs.chairwoman.status === "approved";

  const updated: CandidateApproval = {
    ...approval,
    id: approval.id || `caf_${approval.candidate_id}`,
    status: allApproved ? "approved" : approval.status === "draft" ? "in_review" : approval.status,
    updated_at: now,
    completed_at: allApproved ? approval.completed_at || now : null,
  };

  // 1. Save local
  const local = getLocalApprovals();
  const idx = local.findIndex((a) => a.id === updated.id || a.candidate_id === updated.candidate_id);
  if (idx >= 0) {
    local[idx] = updated;
  } else {
    local.unshift(updated);
  }
  setLocalApprovals(local);

  // 2. Save remote Supabase
  try {
    const { error } = await supabase.from("candidate_approvals").upsert({
      id: updated.id,
      candidate_id: updated.candidate_id,
      form_number: updated.form_number,
      branch_id: updated.branch_id || null,
      status: updated.status,
      candidate_name: updated.candidate_name,
      gender: updated.gender,
      position_applied: updated.position_applied,
      business_unit: updated.business_unit,
      department: updated.department,
      hiring_manager: updated.hiring_manager,
      current_salary: updated.current_salary,
      expectation_salary: updated.expectation_salary,
      current_benefit: updated.current_benefit,
      notice_period: updated.notice_period,
      education_and_skill: updated.education_and_skill,
      work_experience: updated.work_experience,
      strengths: updated.strengths,
      improvement: updated.improvement,
      overall_assessment: updated.overall_assessment,
      interview_panels: updated.interview_panels,
      signatories: updated.signatories,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      completed_at: updated.completed_at,
    });
    if (error) {
      console.error("Supabase candidate_approvals upsert error:", error);
    }
  } catch (err) {
    console.warn("Could not sync candidate_approvals to Supabase, persisted locally:", err);
  }

  return updated;
}

export function isCandidateApprovalCompleted(approval: CandidateApproval | null): boolean {
  if (!approval) return false;
  if (approval.status === "approved") return true;

  const s = approval.signatories;
  return Boolean(
    s &&
    s.ceo?.status === "approved" &&
    s.hr_manager?.status === "approved" &&
    s.division_director?.status === "approved" &&
    s.chairwoman?.status === "approved"
  );
}
