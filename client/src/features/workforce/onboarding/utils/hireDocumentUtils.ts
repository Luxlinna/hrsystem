import type { HireDocument, OnboardingDoc } from "../types";

export function getHireDocIcon(slotKey?: string, name?: string): string {
  const s = (slotKey || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (s.includes("national_id") || n.includes("national id") || n.includes("id card") || n.includes("nid")) {
    return "ri-id-card-line";
  }
  if (s === "social_security_card" || n.includes("social security") || n.includes("nssf")) {
    return "ri-shield-user-line";
  }
  if (s === "birth_certificate" || n.includes("birth certificate") || n.includes("birth cert")) {
    return "ri-file-paper-2-line";
  }
  if (s.includes("family_book") || n.includes("family book") || n.includes("household")) {
    return "ri-book-2-line";
  }
  if (s === "bank_account_proof" || n.includes("bank") || n.includes("account proof") || n.includes("passbook")) {
    return "ri-bank-card-line";
  }
  if (s === "photo_4x6" || n.includes("4x6") || n.includes("headshot") || n.includes("portrait")) {
    return "ri-user-smile-line";
  }
  if (s === "academic_certificates" || n.includes("degree") || n.includes("diploma") || n.includes("academic") || n.includes("certificate")) {
    return "ri-graduation-cap-line";
  }
  if (s === "resume" || n.includes("cv") || n.includes("resume")) {
    return "ri-file-text-line";
  }
  if (n.includes("offer") || n.includes("acceptance")) {
    return "ri-draft-line";
  }
  if (n.includes("contract")) {
    return "ri-file-shield-2-line";
  }
  return "ri-file-line";
}

export function getHireDocColor(slotKey?: string, name?: string): { bg: string; text: string; border: string } {
  const s = (slotKey || "").toLowerCase();
  const n = (name || "").toLowerCase();

  if (s.includes("national_id") || n.includes("id")) {
    return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
  }
  if (s === "social_security_card" || n.includes("nssf") || n.includes("security")) {
    return { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" };
  }
  if (s === "birth_certificate" || n.includes("birth")) {
    return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" };
  }
  if (s.includes("family_book") || n.includes("family")) {
    return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" };
  }
  if (s === "bank_account_proof" || n.includes("bank")) {
    return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
  }
  if (s === "photo_4x6" || n.includes("photo") || n.includes("4x6")) {
    return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
  }
  if (s === "academic_certificates" || n.includes("degree") || n.includes("certificate")) {
    return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };
  }
  if (s === "resume" || n.includes("cv") || n.includes("resume")) {
    return { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200" };
  }
  return { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" };
}

export function matchHireDocToOnboardingDoc(
  onboardingDocName: string,
  hireDocs: HireDocument[]
): HireDocument | undefined {
  const norm = onboardingDocName.toLowerCase();
  return hireDocs.find((h) => {
    if (!h.url) return false;
    const hName = (h.name || "").toLowerCase();
    const slot = (h.doc_slot_key || "").toLowerCase();

    if (norm.includes("id verification") || norm.includes("national id") || norm.includes("passport")) {
      return slot.includes("national_id") || hName.includes("national id") || hName.includes("id card") || hName.includes("nid");
    }
    if (norm.includes("bank details") || norm.includes("bank account")) {
      return slot === "bank_account_proof" || hName.includes("bank") || hName.includes("passbook");
    }
    if (norm.includes("offer letter") || norm.includes("employment terms")) {
      return slot === "offer_letter" || hName.includes("offer") || hName.includes("acceptance") || h.url.includes("offer");
    }
    if (norm.includes("employment contract") || norm.includes("contract")) {
      return slot === "employment_contract" || hName.includes("contract");
    }
    if (norm.includes("cv") || norm.includes("resume") || norm.includes("credential")) {
      return slot === "resume" || hName.includes("cv") || hName.includes("resume");
    }
    if (norm.includes("nda") || norm.includes("confidential")) {
      return slot === "nda" || hName.includes("nda") || hName.includes("confidential");
    }
    if (norm.includes("social security") || norm.includes("nssf")) {
      return slot === "social_security_card" || hName.includes("social security") || hName.includes("nssf");
    }
    if (norm.includes("birth certificate")) {
      return slot === "birth_certificate" || hName.includes("birth");
    }
    if (norm.includes("family book")) {
      return slot.includes("family_book") || hName.includes("family book") || hName.includes("household");
    }
    if (norm.includes("photo") || norm.includes("4x6")) {
      return slot === "photo_4x6" || hName.includes("photo") || hName.includes("4x6");
    }
    if (norm.includes("academic") || norm.includes("degree") || norm.includes("certificate")) {
      return slot === "academic_certificates" || hName.includes("degree") || hName.includes("diploma") || hName.includes("academic");
    }
    return hName.includes(norm);
  });
}

export function findUnsyncedMatchingHireDocs(
  stageDocs: OnboardingDoc[],
  hireDocs: HireDocument[]
): { stageDoc: OnboardingDoc; hireDoc: HireDocument }[] {
  const result: { stageDoc: OnboardingDoc; hireDoc: HireDocument }[] = [];
  const usedHireUrls = new Set<string>();

  for (const doc of stageDocs) {
    if (doc.file_url) {
      usedHireUrls.add(doc.file_url);
    }
  }

  for (const doc of stageDocs) {
    if (!doc.file_url) {
      const match = matchHireDocToOnboardingDoc(doc.document_name, hireDocs);
      if (match && match.url && !usedHireUrls.has(match.url)) {
        result.push({ stageDoc: doc, hireDoc: match });
        usedHireUrls.add(match.url);
      }
    }
  }

  return result;
}
