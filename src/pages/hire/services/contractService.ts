import { supabase } from "@/lib/supabase";
import type { EmploymentContract, ContractWorkflowStage } from "../types/contractTypes";

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
      const local = getLocalContracts();
      const map = new Map<string, EmploymentContract>();
      local.forEach((c) => map.set(c.id, c));
      data.forEach((c) => map.set(c.id, c as EmploymentContract));
      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setLocalContracts(merged);
      return merged.filter((c) => !c.deleted_at);
    }
  } catch {}
  return getLocalContracts().filter((c) => !c.deleted_at);
}

export async function fetchCandidateContract(candidateId: string): Promise<EmploymentContract | null> {
  const contracts = await fetchContracts();
  return contracts.find((c) => c.candidate_id === candidateId && !c.deleted_at) || null;
}

export async function saveContract(contract: EmploymentContract): Promise<EmploymentContract> {
  const now = new Date().toISOString();
  const updated: EmploymentContract = { ...contract, updated_at: now };

  const current = getLocalContracts().filter((c) => c.id !== updated.id);
  setLocalContracts([updated, ...current]);

  try {
    await supabase.from("employment_contracts").upsert(updated, { onConflict: "id" });
  } catch {}

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

  return saveContract(newContract);
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
  return advanceContractStage(contractId, "hr_director_approval", {
    hr_reviewer_name: reviewerName,
    hr_reviewed_at: new Date().toISOString(),
    hr_review_notes: notes,
  });
}

export async function approveByHrDirector(contractId: string, directorName: string, notes?: string) {
  return advanceContractStage(contractId, "chairwoman_approval", {
    hr_director_name: directorName,
    hr_director_approved_at: new Date().toISOString(),
    hr_director_notes: notes,
  });
}

export async function authorizeByChairwoman(contractId: string, chairwomanName: string, notes?: string) {
  return advanceContractStage(contractId, "issued", {
    chairwoman_name: chairwomanName,
    chairwoman_approved_at: new Date().toISOString(),
    chairwoman_notes: notes,
  });
}

export async function issueContract(contractId: string, issuerName: string) {
  return advanceContractStage(contractId, "signed", {
    issued_by_name: issuerName,
    issued_at: new Date().toISOString(),
  });
}

export async function recordContractSignature(contractId: string, signedFileUrl?: string) {
  return advanceContractStage(contractId, "completed", {
    signed_at: new Date().toISOString(),
    signed_by_candidate: true,
    signed_by_company: true,
    signed_contract_url: signedFileUrl,
    completed_at: new Date().toISOString(),
  });
}
