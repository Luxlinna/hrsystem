import { useState, useEffect, useMemo } from "react";
import type { Candidate, HiringRequest, OfferAllowanceItem, OfferLetter } from "../../../types";
import { getEligibleCandidates, getActiveCandidate, getMatchingRequisition } from "./proposalMatching";

export interface UseSalaryProposalStateProps {
  candidate?: Candidate | null;
  candidates: Candidate[];
  hiringRequests: HiringRequest[];
  existingOffers?: OfferLetter[];
  onClose: () => void;
  onSubmit: (payload: {
    candidate: Candidate;
    requisition?: HiringRequest | null;
    base_salary: number;
    probation_salary?: number | null;
    probation_months: number;
    target_start_date: string;
    allowances: OfferAllowanceItem[];
    benefits_summary: string;
    special_terms?: string;
    proposal_notes?: string;
  }) => Promise<any>;
}

export function useSalaryProposalState({
  candidate,
  candidates,
  hiringRequests,
  existingOffers = [],
  onClose,
  onSubmit,
}: UseSalaryProposalStateProps) {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [selectedReqId, setSelectedReqId] = useState<string>("");

  const [baseSalary, setBaseSalary] = useState<number | "">("");
  const [isBasedOnQualification, setIsBasedOnQualification] = useState(false);
  const [probationSalary, setProbationSalary] = useState<number | "">("");
  const [probationMonths, setProbationMonths] = useState<number>(3);
  const [targetStartDate, setTargetStartDate] = useState<string>("");
  const [allowances, setAllowances] = useState<OfferAllowanceItem[]>([
    { name: "Transportation Allowance", amount: 50 },
    { name: "Phone Allowance", amount: 30 },
  ]);
  const [benefitsSummary, setBenefitsSummary] = useState<string>(
    "Comprehensive health & accident insurance, 18 days annual paid leave, public holidays as per labor law, and annual KPI performance appraisal."
  );
  const [specialTerms, setSpecialTerms] = useState<string>("");
  const [proposalNotes, setProposalNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const eligibleCandidates = useMemo(
    () => getEligibleCandidates(candidate, candidates, existingOffers),
    [candidate, candidates, existingOffers]
  );

  const activeCandidate = useMemo(
    () => getActiveCandidate(candidate, candidates, selectedCandidateId, eligibleCandidates),
    [candidate, candidates, selectedCandidateId, eligibleCandidates]
  );

  const candidateExistingOffer = useMemo(() => {
    if (!activeCandidate || !existingOffers.length) return null;
    return existingOffers.find(
      (o) => o.candidate_id === activeCandidate.id && o.status !== "rejected"
    ) || null;
  }, [activeCandidate, existingOffers]);

  const matchedReq = useMemo(
    () => getMatchingRequisition(activeCandidate, hiringRequests, selectedReqId),
    [activeCandidate, hiringRequests, selectedReqId]
  );

  useEffect(() => {
    if (candidate) {
      setSelectedCandidateId(candidate.id);
    } else if (eligibleCandidates.length > 0) {
      if (!selectedCandidateId || !eligibleCandidates.some((c) => c.id === selectedCandidateId)) {
        const preferred = eligibleCandidates.find(
          (c) => c.stage === "salary_negotiation" || c.stage === "selected"
        );
        setSelectedCandidateId(preferred ? preferred.id : eligibleCandidates[0].id);
      }
    } else {
      setSelectedCandidateId("");
    }
  }, [candidate, eligibleCandidates, selectedCandidateId]);

  useEffect(() => {
    if (!targetStartDate) {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);
      setTargetStartDate(nextMonth.toISOString().split("T")[0]);
    }

    if (activeCandidate?.expected_salary && baseSalary === "") {
      setBaseSalary(activeCandidate.expected_salary);
    } else if (matchedReq?.salary_min && baseSalary === "") {
      setBaseSalary(matchedReq.salary_min);
    }
  }, [activeCandidate, matchedReq, targetStartDate, baseSalary]);

  const handleAddAllowance = () => {
    setAllowances([...allowances, { name: "", amount: 0 }]);
  };

  const handleRemoveAllowance = (index: number) => {
    setAllowances(allowances.filter((_, i) => i !== index));
  };

  const handleUpdateAllowance = (index: number, field: "name" | "amount", value: any) => {
    const next = [...allowances];
    if (field === "amount") next[index].amount = Number(value) || 0;
    else next[index].name = value;
    setAllowances(next);
  };

  const totalAllowances = allowances.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalPackage = (Number(baseSalary) || 0) + totalAllowances;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;

    if (candidateExistingOffer) {
      alert(
        `A salary proposal has already been created for ${activeCandidate.full_name} (Offer #${candidateExistingOffer.offer_number}). Candidates at the proposal stage cannot be added again.`
      );
      return;
    }

    if (!isBasedOnQualification && (!baseSalary || Number(baseSalary) <= 0)) {
      alert("Please enter a valid base salary or check 'Based on qualification'.");
      return;
    }
    if (!targetStartDate) {
      alert("Please specify the target commencement date.");
      return;
    }

    const finalBaseSalary = Number(baseSalary) || 0;
    const notesWithQual = isBasedOnQualification
      ? [proposalNotes, "[Salary: Based on Qualification]"].filter(Boolean).join("\n")
      : proposalNotes;
    const termsWithQual = isBasedOnQualification
      ? [specialTerms, "Salary based on qualification & performance."].filter(Boolean).join(" ")
      : specialTerms;

    setSubmitting(true);
    try {
      await onSubmit({
        candidate: activeCandidate,
        requisition: matchedReq,
        base_salary: finalBaseSalary,
        probation_salary: probationSalary ? Number(probationSalary) : null,
        probation_months: probationMonths,
        target_start_date: targetStartDate,
        allowances: allowances.filter((a) => a.name.trim() !== ""),
        benefits_summary: benefitsSummary,
        special_terms: termsWithQual || undefined,
        proposal_notes: notesWithQual || undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return {
    selectedCandidateId,
    setSelectedCandidateId,
    selectedReqId,
    setSelectedReqId,
    baseSalary,
    setBaseSalary,
    isBasedOnQualification,
    setIsBasedOnQualification,
    probationSalary,
    setProbationSalary,
    probationMonths,
    setProbationMonths,
    targetStartDate,
    setTargetStartDate,
    allowances,
    benefitsSummary,
    setBenefitsSummary,
    proposalNotes,
    setProposalNotes,
    submitting,
    eligibleCandidates,
    activeCandidate,
    candidateExistingOffer,
    matchedReq,
    handleAddAllowance,
    handleRemoveAllowance,
    handleUpdateAllowance,
    totalPackage,
    handleSubmit,
  };
}
