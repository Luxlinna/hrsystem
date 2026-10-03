import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { NewCandidateFormState } from "../types";
import { uploadCandidateFiles } from "./candidateUploadHelpers";

export async function executeMergeCandidate(
  existingCandidateId: string,
  candidateForm: NewCandidateFormState,
  candidateFiles: File[] = []
): Promise<boolean> {
  try {
    const newDocs = await uploadCandidateFiles(candidateFiles);
    const { error } = await supabase
      .from("candidates")
      .update({ ...candidateForm, documents: newDocs })
      .eq("id", existingCandidateId);

    if (error) throw error;
    toast("Merged", "Candidate record updated.", "success");
    return true;
  } catch (err: any) {
    toast("Error", err.message || "Failed to merge candidate.", "error");
    return false;
  }
}
