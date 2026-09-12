import { supabase } from "@/lib/supabase";
import type { Candidate, CandidateDocument, OfferLetter } from "../types";
import { previewOfferLetterHtml, exportOfferLetterPdf } from "../exports/exportOfferLetterPdf";
import { exportOfferLetterWord } from "../exports/exportOfferLetterWord";
import { toast } from "@/components/Toast";

export function getFileIcon(name: string, type?: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf" || type?.includes("pdf")) {
    return { icon: "ri-file-pdf-2-line", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" };
  }
  if (["doc", "docx"].includes(ext) || type?.includes("word") || type?.includes("document")) {
    return { icon: "ri-file-word-2-line", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" };
  }
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext) || type?.startsWith("image/")) {
    return { icon: "ri-image-line", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" };
  }
  if (["zip", "rar", "7z", "tar"].includes(ext) || type?.includes("zip") || type?.includes("compressed")) {
    return { icon: "ri-file-zip-line", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" };
  }
  return { icon: "ri-file-text-line", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" };
}

export function formatFileSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isOfferDocument(doc: CandidateDocument): boolean {
  const isHttpUrl = Boolean(
    doc.url &&
      (doc.url.startsWith("http://") ||
        doc.url.startsWith("https://") ||
        doc.url.startsWith("blob:"))
  );

  return (
    !isHttpUrl &&
    Boolean(
      doc.url?.startsWith("#") ||
        doc.url?.startsWith("offer-") ||
        doc.name?.toLowerCase().includes("offer") ||
        doc.name?.toLowerCase().includes("proposal") ||
        ["offer", "accepted", "rejected", "salary_negotiation"].includes(doc.stage_key || "")
    )
  );
}

export async function resolveOfferForDocument(
  candidate: Candidate | null,
  doc: CandidateDocument,
  activeOffer?: OfferLetter | null
): Promise<OfferLetter | null> {
  // 1. Direct match with current active offer
  if (activeOffer) {
    if (!doc.name.includes("OFF-") || doc.name.includes(activeOffer.offer_number)) {
      return activeOffer;
    }
  }

  // 2. Lookup by offer number pattern
  const match = (doc.name + " " + doc.url).match(/OFF-\d{4}-\d+/i);
  const offerNumber = match ? match[0].toUpperCase() : null;

  if (offerNumber) {
    const { data } = await supabase
      .from("offer_letters")
      .select("*")
      .eq("offer_number", offerNumber)
      .maybeSingle();

    if (data) return data as OfferLetter;
  }

  // 3. Fallback to candidate's latest offer
  if (candidate?.id) {
    const { data } = await supabase
      .from("offer_letters")
      .select("*")
      .eq("candidate_id", candidate.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) return data as OfferLetter;
  }

  // 4. Fallback synthetic offer
  if (candidate) {
    return {
      id: `synth-${candidate.id}`,
      candidate_id: candidate.id,
      candidate_name: candidate.full_name,
      candidate_email: candidate.email,
      candidate_phone: candidate.phone,
      job_title: candidate.job_title || candidate.position || "Designated Role",
      department: candidate.department || "",
      business_unit: candidate.division || "",
      base_salary: candidate.expected_salary || 0,
      currency: "USD",
      status: (doc.stage_key as any) || "accepted",
      offer_number: offerNumber || "OFF-RECORD",
      created_at: candidate.created_at,
      target_start_date: candidate.created_at,
      decision_at: doc.uploaded_at || new Date().toISOString(),
    } as OfferLetter;
  }

  return null;
}

export function openOfferDocumentPreview(
  offer: OfferLetter,
  onExportPdf?: (offer: OfferLetter) => void
): void {
  const opened = previewOfferLetterHtml(offer);
  if (!opened) {
    if (onExportPdf) {
      onExportPdf(offer);
    } else {
      exportOfferLetterPdf(offer);
    }
  }
}

export async function downloadOfferDocument(
  offer: OfferLetter,
  format: "word" | "pdf",
  onExportWord?: (offer: OfferLetter) => Promise<any>,
  onExportPdf?: (offer: OfferLetter) => void
): Promise<void> {
  if (format === "word") {
    if (onExportWord) {
      await onExportWord(offer);
    } else {
      await exportOfferLetterWord(offer);
    }
    toast("Document Exported", `Downloaded ${offer.offer_number} Word document.`, "success");
  } else {
    if (onExportPdf) {
      onExportPdf(offer);
    } else {
      exportOfferLetterPdf(offer);
    }
  }
}
