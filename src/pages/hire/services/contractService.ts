import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import type { EmploymentContract, ContractWorkflowStage } from "../types/contractTypes";
import {
  notifyContractReady,
  notifyContractApproved,
} from "@/services/notifications/recruitmentNotificationTriggers";

const LOCAL_STORAGE_KEY = "hrm_employment_contracts_store";

export function getLocalContracts(): EmploymentContract[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalContracts(contracts: EmploymentContract[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(contracts));
  } catch {}
}

export async function fetchContracts(): Promise<EmploymentContract[]> {
  try {
    const { data, error } = await supabase
      .from("employment_contracts")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      setLocalContracts(data as EmploymentContract[]);
      return data as EmploymentContract[];
    }
  } catch {}
  return getLocalContracts().filter((c) => !c.deleted_at);
}

export async function fetchCandidateContract(candidateId: string): Promise<EmploymentContract | null> {
  try {
    const { data, error } = await supabase
      .from("employment_contracts")
      .select("*")
      .eq("candidate_id", candidateId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as EmploymentContract;
    }
  } catch {}
  const contracts = getLocalContracts();
  return contracts.find((c) => c.candidate_id === candidateId && !c.deleted_at) || null;
}

export async function saveContract(contract: EmploymentContract): Promise<EmploymentContract> {
  const now = new Date().toISOString();
  const updated: EmploymentContract = { ...contract, updated_at: now };

  try {
    const { data, error } = await supabase
      .from("employment_contracts")
      .upsert(updated, { onConflict: "id" })
      .select()
      .single();

    if (!error && data) {
      const current = getLocalContracts().filter((c) => c.id !== data.id);
      setLocalContracts([data as EmploymentContract, ...current]);
      return data as EmploymentContract;
    }
  } catch (err) {
    console.warn("Failed to persist contract to Supabase, falling back to localStorage", err);
  }

  const current = getLocalContracts().filter((c) => c.id !== updated.id);
  setLocalContracts([updated, ...current]);
  return updated;
}

export async function createContractDraft(payload: {
  candidate_id: string;
  candidate_name: string;
  candidate_email?: string | null;
  job_posting_id?: string | null;
  position_title: string;
  department: string;
  branch_id?: string | null;
  business_unit_name: string;
  offer_id?: string | null;
  offer_reference?: string | null;
  contract_type: "probationary" | "fixed_term" | "permanent";
  start_date: string;
  end_date?: string | null;
  probation_months: number;
  monthly_salary: number;
  currency: string;
  created_by_name: string;
}): Promise<EmploymentContract> {
  const id = `cnt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const contractNumber = `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const newContract: EmploymentContract = {
    id,
    contract_number: contractNumber,
    status: "draft",
    created_at: now,
    updated_at: now,
    ...payload,
  };

  const saved = await saveContract(newContract);

  void logActivity({
    module: "hire",
    action: "contract_created",
    entityType: "employment_contract",
    entityId: newContract.id,
    actorName: payload.created_by_name || "HR Officer",
    actorRole: "HR Specialist",
    businessUnit: "HR Division",
    targetBusinessUnit: payload.business_unit_name,
    isCrossBu: true,
    branchId: payload.branch_id || null,
    description: `${payload.created_by_name || "HR Officer"} created contract draft ${contractNumber} for ${payload.candidate_name}. Business Unit: ${payload.business_unit_name}.`,
    metadata: {
      contract_number: contractNumber,
      candidate_name: payload.candidate_name,
      monthly_salary: payload.monthly_salary,
      currency: payload.currency,
      business_unit: "HR Division",
      target_business_unit: payload.business_unit_name,
      is_cross_bu: true,
    },
  });

  // Canonical Notification Engine Dispatch (Event 14: Contract ready)
  void notifyContractReady({
    contract: saved,
    createdBy: payload.created_by_name || "HR Officer",
  }).catch((e) => console.error("[notifyContractReady] error:", e));

  return saved;
}

export async function advanceContractStage(
  contractId: string,
  newStage: ContractWorkflowStage,
  extraFields: Partial<EmploymentContract> = {}
): Promise<EmploymentContract> {
  const contracts = await fetchContracts();
  const contract = contracts.find((c) => c.id === contractId);
  if (!contract) throw new Error("Contract not found");

  const updated: EmploymentContract = {
    ...contract,
    ...extraFields,
    status: newStage,
  };

  return saveContract(updated);
}

export async function endorseHrReview(contractId: string, reviewerName: string, notes?: string) {
  const updated = await advanceContractStage(contractId, "hr_director_approval", {
    hr_reviewer_name: reviewerName,
    hr_reviewed_at: new Date().toISOString(),
    hr_review_notes: notes,
  });

  void logActivity({
    module: "hire",
    action: "contract_hr_manager_reviewed",
    entityType: "employment_contract",
    entityId: updated.id,
    actorName: reviewerName,
    actorRole: "HR Manager",
    businessUnit: "HR Division",
    targetBusinessUnit: updated.business_unit_name,
    isCrossBu: true,
    branchId: updated.branch_id || null,
    description: `${reviewerName} (HR Manager) reviewed & endorsed contract ${updated.contract_number} for ${updated.candidate_name}. Cross-BU: HR Division → ${updated.business_unit_name}.`,
    metadata: {
      contract_number: updated.contract_number,
      candidate_name: updated.candidate_name,
      business_unit: "HR Division",
      target_business_unit: updated.business_unit_name,
      is_cross_bu: true,
      notes: notes || null,
    },
  });

  // Canonical Notification Engine Dispatch (Event 15: Contract approved - HR Review)
  void notifyContractApproved({
    contract: updated,
    approverName: reviewerName,
    approverRole: "HR Manager",
    isFinalAuthorization: false,
  }).catch((e) => console.error("[notifyContractApproved HR Review] error:", e));

  return updated;
}

export async function approveByHrDirector(contractId: string, directorName: string, notes?: string) {
  const updated = await advanceContractStage(contractId, "chairwoman_approval", {
    hr_director_name: directorName,
    hr_director_approved_at: new Date().toISOString(),
    hr_director_notes: notes,
  });

  void logActivity({
    module: "hire",
    action: "contract_hr_director_approved",
    entityType: "employment_contract",
    entityId: updated.id,
    actorName: directorName,
    actorRole: "HR Admin Director",
    businessUnit: "HR Division",
    targetBusinessUnit: updated.business_unit_name,
    isCrossBu: true,
    branchId: updated.branch_id || null,
    description: `${directorName} (HR Admin Director) approved contract ${updated.contract_number} for ${updated.candidate_name}. Cross-BU: HR Division → ${updated.business_unit_name}.`,
    metadata: {
      contract_number: updated.contract_number,
      candidate_name: updated.candidate_name,
      business_unit: "HR Division",
      target_business_unit: updated.business_unit_name,
      is_cross_bu: true,
      notes: notes || null,
    },
  });

  // Canonical Notification Engine Dispatch (Event 15: Contract approved - Director Approval)
  void notifyContractApproved({
    contract: updated,
    approverName: directorName,
    approverRole: "HR Admin Director",
    isFinalAuthorization: false,
  }).catch((e) => console.error("[notifyContractApproved Director] error:", e));

  return updated;
}

export async function authorizeByChairwoman(contractId: string, chairwomanName: string, notes?: string) {
  const updated = await advanceContractStage(contractId, "issued", {
    chairwoman_name: chairwomanName,
    chairwoman_approved_at: new Date().toISOString(),
    chairwoman_notes: notes,
  });

  void logActivity({
    module: "hire",
    action: "contract_chairwoman_authorized",
    entityType: "employment_contract",
    entityId: updated.id,
    actorName: chairwomanName,
    actorRole: "Chairwoman",
    businessUnit: "Corporate Executive Office",
    targetBusinessUnit: updated.business_unit_name,
    isCrossBu: true,
    branchId: updated.branch_id || null,
    description: `Chairwoman ${chairwomanName} authorized contract ${updated.contract_number} for ${updated.candidate_name}. Target BU: ${updated.business_unit_name}.`,
    metadata: {
      contract_number: updated.contract_number,
      candidate_name: updated.candidate_name,
      business_unit: "Corporate Executive Office",
      target_business_unit: updated.business_unit_name,
      is_cross_bu: true,
      notes: notes || null,
    },
  });

  // Canonical Notification Engine Dispatch (Event 15: Contract approved - Chairwoman Supreme Authorization)
  void notifyContractApproved({
    contract: updated,
    approverName: chairwomanName,
    approverRole: "Chairwoman",
    isFinalAuthorization: true,
  }).catch((e) => console.error("[notifyContractApproved Chairwoman] error:", e));

  return updated;
}

export async function issueContract(contractId: string, issuerName: string) {
  const updated = await advanceContractStage(contractId, "signed", {
    issued_by_name: issuerName,
    issued_at: new Date().toISOString(),
  });

  void logActivity({
    module: "hire",
    action: "contract_issued",
    entityType: "employment_contract",
    entityId: updated.id,
    actorName: issuerName,
    actorRole: "HR Specialist",
    businessUnit: "HR Division",
    targetBusinessUnit: updated.business_unit_name,
    isCrossBu: true,
    branchId: updated.branch_id || null,
    description: `${issuerName} (HR Division) issued contract ${updated.contract_number} to ${updated.candidate_name}. Target BU: ${updated.business_unit_name}.`,
    metadata: {
      contract_number: updated.contract_number,
      candidate_name: updated.candidate_name,
      business_unit: "HR Division",
      target_business_unit: updated.business_unit_name,
      is_cross_bu: true,
    },
  });

  return updated;
}

export async function recordContractSignature(contractId: string, signedFileUrl?: string) {
  const updated = await advanceContractStage(contractId, "completed", {
    signed_at: new Date().toISOString(),
    signed_by_candidate: true,
    signed_by_company: true,
    signed_contract_url: signedFileUrl,
    completed_at: new Date().toISOString(),
  });

  void logActivity({
    module: "hire",
    action: "contract_completed_signed",
    entityType: "employment_contract",
    entityId: updated.id,
    actorName: updated.candidate_name,
    actorRole: "Candidate & Employer",
    businessUnit: updated.business_unit_name,
    branchId: updated.branch_id || null,
    description: `Employment contract ${updated.contract_number} for ${updated.candidate_name} fully signed and completed. Business Unit: ${updated.business_unit_name}.`,
    metadata: {
      contract_number: updated.contract_number,
      candidate_name: updated.candidate_name,
      business_unit: updated.business_unit_name,
      is_cross_bu: false,
    },
  });

  return updated;
}
