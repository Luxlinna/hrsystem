import { useState, useEffect } from "react";
import { toast } from "@/components/Toast";
import { uploadFileToS3 } from "@/lib/s3-storage";
import type { MyEmployee } from "../types";
import { syncEmployeeAndCandidate } from "../profileUtils";

interface UseProfileProfessionalMutationsProps {
  employee: MyEmployee | null;
  setEmployee: React.Dispatch<React.SetStateAction<MyEmployee | null>>;
}

export function useProfileProfessionalMutations({
  employee,
  setEmployee,
}: UseProfileProfessionalMutationsProps) {
  const [location, setLocation] = useState("");
  const [education, setEducation] = useState("");
  const [workExperience, setWorkExperience] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [expectedSalary, setExpectedSalary] = useState<string>("");
  const [noticePeriod, setNoticePeriod] = useState<string>("1 Month");
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Sync state when employee is loaded
  useEffect(() => {
    if (!employee) return;
    setLocation(employee.location || "");
    setEducation(employee.education || "");
    setWorkExperience(employee.work_experience || "");
    setSkills(employee.skills || []);
    setLanguages(employee.languages || []);
    setExpectedSalary(
      employee.expected_salary !== null && employee.expected_salary !== undefined
        ? String(employee.expected_salary)
        : ""
    );
    setNoticePeriod(employee.notice_period || "1 Month");
    setResumeUrl(employee.resume_url || null);
    setResumeName(employee.resume_name || null);
  }, [employee]);

  const handleSaveProfessional = async () => {
    if (!employee?.id) {
      toast("Error", "No employee record found to update", "error");
      return;
    }

    setSaving(true);
    try {
      const parsedSalary = expectedSalary.trim() ? parseFloat(expectedSalary) : null;
      const updatePayload = {
        location: location.trim() || null,
        education: education.trim() || null,
        work_experience: workExperience.trim() || null,
        skills,
        languages,
        expected_salary: isNaN(parsedSalary as number) ? null : parsedSalary,
        notice_period: noticePeriod.trim() || null,
        resume_url: resumeUrl,
        resume_name: resumeName,
      };

      await syncEmployeeAndCandidate(employee.id, employee.candidate_id, updatePayload);
      setEmployee((prev) => (prev ? { ...prev, ...updatePayload } : null));

      toast("Saved", "Professional profile updated successfully", "success");
    } catch (err: any) {
      console.error("Failed to update professional profile:", err);
      toast("Update failed", err.message || "Could not update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (file: File) => {
    if (!employee?.id) return;
    setUploadingResume(true);
    try {
      const uploaded = await uploadFileToS3(file, "employees/resumes");
      setResumeUrl(uploaded.url);
      setResumeName(uploaded.name);

      const payload = { resume_url: uploaded.url, resume_name: uploaded.name };
      await syncEmployeeAndCandidate(employee.id, employee.candidate_id, payload);
      setEmployee((prev) => (prev ? { ...prev, ...payload } : null));

      toast("Resume Uploaded", "Your CV was uploaded successfully", "success");
    } catch (err: any) {
      console.error("Failed to upload CV:", err);
      toast("Upload failed", err.message || "Could not upload CV", "error");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleRemoveResume = async () => {
    if (!employee?.id) return;
    try {
      const payload = { resume_url: null, resume_name: null };
      await syncEmployeeAndCandidate(employee.id, employee.candidate_id, payload);

      setResumeUrl(null);
      setResumeName(null);
      setEmployee((prev) => (prev ? { ...prev, ...payload } : null));

      toast("Resume Removed", "Your CV was removed", "success");
    } catch (err: any) {
      console.error("Failed to remove CV:", err);
      toast("Error", err.message || "Could not remove CV", "error");
    }
  };

  return {
    location,
    setLocation,
    education,
    setEducation,
    workExperience,
    setWorkExperience,
    skills,
    setSkills,
    languages,
    setLanguages,
    expectedSalary,
    setExpectedSalary,
    noticePeriod,
    setNoticePeriod,
    resumeUrl,
    resumeName,
    savingProfessional: saving,
    uploadingResume,
    handleSaveProfessional,
    handleResumeUpload,
    handleRemoveResume,
  };
}
