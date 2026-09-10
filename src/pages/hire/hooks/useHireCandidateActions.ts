import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { uploadFileToS3, uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { startOnboardingForEmployee } from "@/lib/onboarding";
import type { Candidate, Job, Interview, CandidateDocument } from "../types";

interface UseHireCandidateActionsProps {
  actorName: string;
  actorRole: string;
  myEmployeeId?: string;
  loadData: () => Promise<void>;
  branches: any[];
  jobs: Job[];
  setUploadingResume: (val: boolean) => void;
  setSchedulingInterview: (val: boolean) => void;
  setMovingToOnboarding: (val: boolean) => void;
  setSavingFeedback: (val: boolean) => void;
}

const isUuid = (str?: string | null) =>
  !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export function useHireCandidateActions({
  actorName,
  myEmployeeId,
  loadData,
  branches,
  jobs,
  setUploadingResume,
  setSchedulingInterview,
  setMovingToOnboarding,
  setSavingFeedback,
}: UseHireCandidateActionsProps) {
  const uploadCandidateResume = useCallback(
    async (file: File): Promise<string | null> => {
      setUploadingResume(true);
      try {
        const item = await uploadFileToS3(file, "candidates/resumes");
        return item.url;
      } catch (err: any) {
        toast("AWS S3 Upload Error", err.message || "Failed to upload resume to AWS S3.", "error");
        return null;
      } finally {
        setUploadingResume(false);
      }
    },
    [setUploadingResume]
  );

  const handleSaveCandidate = useCallback(
    async (
      candidateForm: any,
      editingCandidate: Candidate | null,
      filesToUpload?: File[] | File | null
    ) => {
      if (!candidateForm.full_name || !candidateForm.email || !candidateForm.job_posting_id) {
        toast("Validation Error", "Name, email, and job are required.", "error");
        return false;
      }
      setUploadingResume(true);
      try {
        const filesList: File[] = Array.isArray(filesToUpload)
          ? filesToUpload
          : filesToUpload
          ? [filesToUpload]
          : [];

        let newDocs: CandidateDocument[] = [];
        if (filesList.length > 0) {
          try {
            const s3Items = await uploadMultipleFilesToS3(filesList, "candidates/documents");
            newDocs = s3Items.map((item) => ({
              name: item.name,
              url: item.url,
              size: item.size,
              type: item.type,
              uploaded_at: new Date().toISOString(),
            }));
          } catch (s3Err) {
            console.warn("AWS S3 upload failed, attempting Supabase storage fallback:", s3Err);
            for (const file of filesList) {
              try {
                const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
                const path = `resumes/${Date.now()}_${cleanName}`;
                const { error: upErr } = await supabase.storage.from("candidates").upload(path, file, { upsert: true });
                if (!upErr) {
                  const { data } = supabase.storage.from("candidates").getPublicUrl(path);
                  newDocs.push({
                    name: file.name,
                    url: data.publicUrl,
                    size: file.size,
                    type: file.type,
                    uploaded_at: new Date().toISOString(),
                  });
                } else {
                  newDocs.push({
                    name: file.name,
                    url: "",
                    size: file.size,
                    type: file.type,
                    uploaded_at: new Date().toISOString(),
                  });
                }
              } catch {
                newDocs.push({
                  name: file.name,
                  url: "",
                  size: file.size,
                  type: file.type,
                  uploaded_at: new Date().toISOString(),
                });
              }
            }
          }
        }

        const existingDocs: CandidateDocument[] = editingCandidate?.documents || (
          editingCandidate?.resume_url
            ? [{ name: editingCandidate.resume_name || "Resume", url: editingCandidate.resume_url }]
            : []
        );

        const allDocs = [...existingDocs, ...newDocs];
        const primaryDoc = allDocs[0] || null;

        const parseArray = (str?: string) =>
          str ? str.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean) : [];

        const payload: any = {
          full_name: candidateForm.full_name,
          email: candidateForm.email,
          phone: candidateForm.phone || null,
          location: candidateForm.location || null,
          education: candidateForm.education || null,
          work_experience: candidateForm.work_experience || null,
          skills: parseArray(candidateForm.skills),
          languages: parseArray(candidateForm.languages),
          expected_salary: candidateForm.expected_salary ? Number(candidateForm.expected_salary) : null,
          notice_period: candidateForm.notice_period || null,
          assigned_recruiter_id: candidateForm.assigned_recruiter_id || null,
          tags: parseArray(candidateForm.tags),
          job_posting_id: candidateForm.job_posting_id || null,
          source: candidateForm.source,
          notes: candidateForm.notes || null,
          documents: allDocs,
          ...(primaryDoc ? { resume_url: primaryDoc.url, resume_name: primaryDoc.name } : {}),
        };

        if (editingCandidate) {
          const { error } = await supabase.from("candidates").update(payload).eq("id", editingCandidate.id);
          if (error) throw error;
          toast("Candidate Profile Updated", `"${candidateForm.full_name}" master profile saved.`, "success");
        } else {
          payload.stage = "applied";
          const { data: newCand, error } = await supabase.from("candidates").insert(payload).select().single();
          if (error) throw error;
          if (newCand?.id && candidateForm.job_posting_id) {
            await supabase.from("candidate_applications").insert({
              candidate_id: newCand.id,
              job_posting_id: candidateForm.job_posting_id,
              stage: "applied",
              source: candidateForm.source,
              outcome: "in_progress",
              notes: candidateForm.notes || null,
            });
          }
          toast("Candidate Created", `"${candidateForm.full_name}" registered in Master Database.`, "success");
        }
        await loadData();
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to save candidate files to AWS S3.", "error");
        return false;
      } finally {
        setUploadingResume(false);
      }
    },
    [loadData, setUploadingResume]
  );

  const handleSaveInterview = useCallback(
    async (interviewForm: any, editingInterview: Interview | null) => {
      if (!interviewForm.candidate_id || !interviewForm.scheduled_at) {
        toast("Validation Error", "Candidate and date/time are required.", "error");
        return false;
      }
      setSchedulingInterview(true);
      try {
        const payload = {
          candidate_id: interviewForm.candidate_id,
          scheduled_at: new Date(interviewForm.scheduled_at).toISOString(),
          duration_minutes: Number(interviewForm.duration_minutes) || 60,
          type: interviewForm.type,
          notes: interviewForm.notes || null,
        };
        if (editingInterview) {
          const { error } = await supabase.from("interviews").update(payload).eq("id", editingInterview.id);
          if (error) throw error;
          toast("Interview Updated", "Interview details saved.", "success");
        } else {
          const { error } = await supabase.from("interviews").insert({
            ...payload,
            interviewer_id: isUuid(myEmployeeId) ? myEmployeeId : null,
            status: "scheduled",
          });
          if (error) throw error;
          toast("Interview Scheduled", "Interview scheduled successfully.", "success");
        }
        await loadData();
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to schedule interview.", "error");
        return false;
      } finally {
        setSchedulingInterview(false);
      }
    },
    [myEmployeeId, loadData, setSchedulingInterview]
  );

  const handleMoveToOnboarding = useCallback(
    async (candidate: Candidate, branchId: string, joinDate: string) => {
      if (!branchId || !joinDate) return false;
      setMovingToOnboarding(true);
      try {
        const job = jobs.find((j) => j.id === candidate.job_posting_id);
        const nameParts = candidate.full_name.trim().split(/\s+/);
        const isSite = branchId.startsWith("site:");
        const siteObj = isSite ? branches.find((b: any) => b.id === branchId) : null;
        const targetBranchId = isSite ? siteObj?.branch_id : branchId;
        const targetSiteId = isSite ? branchId.substring(5) : null;

        // Check if employee already exists with candidate email
        const { data: existingEmp } = await supabase
          .from("employees")
          .select("id")
          .eq("email", candidate.email)
          .maybeSingle();

        const employeePayload = {
          first_name: nameParts[0] || candidate.full_name,
          last_name: nameParts.slice(1).join(" ") || "-",
          email: candidate.email,
          phone: candidate.phone || null,
          role: job?.title || "New Hire",
          department: job?.department || "General",
          branch_id: targetBranchId,
          default_work_location_id: targetSiteId,
          status: "onboarding",
          join_date: joinDate,
          // Transfer full Candidate Master Database credentials to employee record
          candidate_id: candidate.id,
          candidate_code: candidate.candidate_code || null,
          location: candidate.location || null,
          education: candidate.education || null,
          work_experience: candidate.work_experience || null,
          skills: candidate.skills || [],
          languages: candidate.languages || [],
          expected_salary: candidate.expected_salary ? Number(candidate.expected_salary) : null,
          notice_period: candidate.notice_period || null,
          resume_url: candidate.resume_url || null,
          resume_name: candidate.resume_name || null,
        };

        let employeeId: string;
        if (existingEmp?.id) {
          employeeId = existingEmp.id;
          const { error: updErr } = await supabase
            .from("employees")
            .update(employeePayload)
            .eq("id", employeeId);
          if (updErr) throw updErr;
        } else {
          const { data: newEmp, error: empErr } = await supabase
            .from("employees")
            .insert(employeePayload)
            .select()
            .single();
          if (empErr) throw empErr;
          employeeId = newEmp.id;
        }

        // Initialize Onboarding Journey & Tasks for the employee
        await startOnboardingForEmployee(employeeId, actorName);

        // Update candidate stage to hired
        await supabase.from("candidates").update({ stage: "hired" }).eq("id", candidate.id);

        // Update candidate applications history
        if (candidate.job_posting_id) {
          await supabase
            .from("candidate_applications")
            .update({ stage: "hired", outcome: "hired" })
            .eq("candidate_id", candidate.id)
            .eq("job_posting_id", candidate.job_posting_id);
        }

        toast("Moved to Onboarding", `${candidate.full_name} is now in onboarding with full credentials transferred.`, "success");
        await loadData();
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to move candidate to onboarding.", "error");
        return false;
      } finally {
        setMovingToOnboarding(false);
      }
    },
    [jobs, branches, actorName, loadData, setMovingToOnboarding]
  );

  const handleSaveFeedback = useCallback(
    async (interview: Interview, score: number, notes: string) => {
      setSavingFeedback(true);
      try {
        const { error } = await supabase.from("interviews").update({ score, feedback: notes || null, status: "completed" }).eq("id", interview.id);
        if (error) throw error;
        toast("Feedback Submitted", "Interview feedback recorded.", "success");
        await loadData();
        return true;
      } catch (err: any) {
        toast("Error", err.message || "Failed to save feedback.", "error");
        return false;
      } finally {
        setSavingFeedback(false);
      }
    },
    [loadData, setSavingFeedback]
  );

  const handleMergeCandidate = useCallback(
    async (
      existingCandidateId: string,
      candidateForm: NewCandidateFormState,
      candidateFiles: File[] = []
    ): Promise<boolean> => {
      setUploadingResume(true);
      try {
        const { data: existing, error: fetchErr } = await supabase
          .from("candidates")
          .select("*")
          .eq("id", existingCandidateId)
          .single();
        if (fetchErr) throw fetchErr;

        const newDocs: CandidateDocument[] = [];
        for (const file of candidateFiles) {
          try {
            const url = await uploadToS3(file, "candidates");
            newDocs.push({
              name: file.name,
              url,
              size: file.size,
              type: file.type,
              uploaded_at: new Date().toISOString(),
            });
          } catch (uploadErr) {
            console.warn("S3 Upload error for file, attempting Supabase storage fallback:", file.name, uploadErr);
            try {
              const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
              const path = `resumes/${Date.now()}_${cleanName}`;
              const { error: upErr } = await supabase.storage.from("candidates").upload(path, file, { upsert: true });
              if (!upErr) {
                const { data } = supabase.storage.from("candidates").getPublicUrl(path);
                newDocs.push({
                  name: file.name,
                  url: data.publicUrl,
                  size: file.size,
                  type: file.type,
                  uploaded_at: new Date().toISOString(),
                });
              } else {
                newDocs.push({
                  name: file.name,
                  url: "",
                  size: file.size,
                  type: file.type,
                  uploaded_at: new Date().toISOString(),
                });
              }
            } catch {
              newDocs.push({
                name: file.name,
                url: "",
                size: file.size,
                type: file.type,
                uploaded_at: new Date().toISOString(),
              });
            }
          }
        }

        const existingDocs: CandidateDocument[] = existing?.documents || (
          existing?.resume_url
            ? [{ name: existing.resume_name || "Resume", url: existing.resume_url }]
            : []
        );

        const allDocs = [...existingDocs, ...newDocs];
        const latestResume = newDocs[0] || (existingDocs[0] || null);

        const parseArray = (str?: string) =>
          str ? str.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean) : [];

        const mergedNotes = [
          existing.notes,
          `[Merged CV on ${new Date().toLocaleDateString()}]: ${candidateForm.notes || "New CV uploaded and merged."}`,
        ].filter(Boolean).join("\n\n");

        const updatePayload: any = {
          documents: allDocs,
          notes: mergedNotes,
        };

        if (latestResume) {
          updatePayload.resume_url = latestResume.url;
          updatePayload.resume_name = latestResume.name;
        }

        if (!existing.phone && candidateForm.phone) updatePayload.phone = candidateForm.phone;
        if (!existing.location && candidateForm.location) updatePayload.location = candidateForm.location;
        if (!existing.education && candidateForm.education) updatePayload.education = candidateForm.education;
        if (!existing.work_experience && candidateForm.work_experience) updatePayload.work_experience = candidateForm.work_experience;

        const existingSkills: string[] = existing.skills || [];
        const newSkills = parseArray(candidateForm.skills);
        const mergedSkills = Array.from(new Set([...existingSkills, ...newSkills]));
        if (mergedSkills.length > 0) updatePayload.skills = mergedSkills;

        const { error: updateErr } = await supabase
          .from("candidates")
          .update(updatePayload)
          .eq("id", existingCandidateId);
        if (updateErr) throw updateErr;

        if (candidateForm.job_posting_id) {
          const { data: existingApp } = await supabase
            .from("candidate_applications")
            .select("id")
            .eq("candidate_id", existingCandidateId)
            .eq("job_posting_id", candidateForm.job_posting_id)
            .maybeSingle();

          if (!existingApp) {
            await supabase.from("candidate_applications").insert({
              candidate_id: existingCandidateId,
              job_posting_id: candidateForm.job_posting_id,
              stage: existing.stage || "applied",
              source: candidateForm.source,
              outcome: "in_progress",
              notes: `Applied via merged CV on ${new Date().toLocaleDateString()}`,
            });
          }
        }

        toast(
          "Profiles Merged",
          `Merged new CV into "${existing.full_name}"'s master record.`,
          "success"
        );
        await loadData();
        return true;
      } catch (err: any) {
        toast("Merge Failed", err.message || "Could not merge candidate profile.", "error");
        return false;
      } finally {
        setUploadingResume(false);
      }
    },
    [loadData, setUploadingResume]
  );

  return {
    uploadCandidateResume,
    handleSaveCandidate,
    handleMergeCandidate,
    handleSaveInterview,
    handleMoveToOnboarding,
    handleSaveFeedback,
  };
}
