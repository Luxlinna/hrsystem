import type { OfferLetter } from "../types";
import { exportOfferLetterPdf } from "../exports/exportOfferLetterPdf";
import { exportOfferLetterWord } from "../exports/exportOfferLetterWord";

export function isOfferAtHrBranch(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
    (/hr\s*division|human\s*resource|\bhr\b/i.test(localStorage.getItem("hrm_selected_branch_name") || "") ||
     localStorage.getItem("hrm_selected_branch_id") === "68b6c801-3581-460a-9918-2c6b5434fc7c")
  );
}

export function executeExportOfferPdf(offer: OfferLetter) {
  exportOfferLetterPdf(offer, undefined, isOfferAtHrBranch());
}

export async function executeExportOfferWord(offer: OfferLetter) {
  await exportOfferLetterWord(offer, undefined, isOfferAtHrBranch());
}
