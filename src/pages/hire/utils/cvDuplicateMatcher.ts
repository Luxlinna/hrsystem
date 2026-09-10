import type { Candidate } from "../types";
import { normalizeEmail, normalizePhone, type ExtractedCvData } from "./cvExtractor";

export interface DuplicateMatchResult {
  isDuplicate: boolean;
  matchType: "strong" | "potential" | "none";
  matchScore: number; // 0 to 100
  matchedCandidate: Candidate | null;
  matchReasons: string[];
  fieldMatches: {
    field: string;
    label: string;
    isMatched: boolean;
    extractedValue?: string;
    existingValue?: string;
    scoreContribution?: string;
  }[];
}

/**
 * Calculates string similarity using Dice's bigram coefficient (0 to 1).
 */
function stringSimilarity(s1: string, s2: string): number {
  const str1 = s1.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const str2 = s2.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;
  if (str1.length === 1 && str2.length === 1) return str1 === str2 ? 1 : 0;

  const pairs1 = new Set<string>();
  for (let i = 0; i < str1.length - 1; i++) {
    pairs1.add(str1.slice(i, i + 2));
  }

  const pairs2 = new Set<string>();
  for (let i = 0; i < str2.length - 1; i++) {
    pairs2.add(str2.slice(i, i + 2));
  }

  let intersection = 0;
  for (const pair of pairs1) {
    if (pairs2.has(pair)) intersection++;
  }

  return (2 * intersection) / (pairs1.size + pairs2.size);
}

/**
 * Checks if two text strings have any matching company or role words.
 */
function hasOverlap(list1?: string[], text2?: string | null): boolean {
  if (!list1 || list1.length === 0 || !text2) return false;
  const lowerText2 = text2.toLowerCase();
  return list1.some((item) => {
    const clean = item.toLowerCase().trim();
    return clean.length >= 3 && lowerText2.includes(clean);
  });
}

/**
 * Checks Jaccard similarity between two arrays of skills.
 */
function skillsOverlapScore(skills1?: string[], skills2?: string[] | null): number {
  if (!skills1 || !skills2 || skills1.length === 0 || skills2.length === 0) return 0;
  const set1 = new Set(skills1.map((s) => s.toLowerCase().trim()));
  const set2 = new Set(skills2.map((s) => s.toLowerCase().trim()));

  let overlap = 0;
  for (const item of set1) {
    if (set2.has(item)) overlap++;
  }

  const union = new Set([...set1, ...set2]).size;
  return union > 0 ? overlap / union : 0;
}

import { supabase } from "@/lib/supabase";

/**
 * Evaluates duplicate probability of an uploaded CV against existing candidates.
 * Checks:
 * 1. Identical CV Document / Filename (100% Strong Match)
 * 2. Exact Email or Phone match (100% Strong Match)
 * 3. Text inclusion in CV (100% Strong Match if candidate's email or phone is found in rawText)
 * 4. Composite potential match (Name 40%, Company 20%, Position 15%, Education 15%, Skills 10%)
 */
export function findDuplicateCandidate(
  extracted: ExtractedCvData,
  existingCandidates: Candidate[],
  excludeCandidateId?: string | null,
  uploadedFile?: File | null
): DuplicateMatchResult {
  const normEmail = normalizeEmail(extracted.email);
  const normPhone = normalizePhone(extracted.phone);
  const rawTextLower = (extracted.rawText || "").toLowerCase();
  const rawDigits = (extracted.rawText || "").replace(/\D/g, "");

  const uploadedName = (uploadedFile?.name || "").trim().toLowerCase();
  const baseUploadedName = uploadedName
    .replace(/^(\d+[-_]|uuid[-_])/i, "")
    .replace(/\.[^/.]+$/, "")
    .trim();

  let bestMatch: DuplicateMatchResult = {
    isDuplicate: false,
    matchType: "none",
    matchScore: 0,
    matchedCandidate: null,
    matchReasons: [],
    fieldMatches: [],
  };

  for (const candidate of existingCandidates) {
    if (excludeCandidateId && candidate.id === excludeCandidateId) continue;

    const candEmail = normalizeEmail(candidate.email);
    const candPhone = normalizePhone(candidate.phone);

    // 1. Identical CV File / Document Check
    const existingResumeName = (candidate.resume_name || "").trim().toLowerCase();
    const baseExistingName = existingResumeName
      .replace(/^(\d+[-_]|uuid[-_])/i, "")
      .replace(/\.[^/.]+$/, "")
      .trim();

    let fileMatched = false;
    let matchedDocName = "";

    if (uploadedName && uploadedName.length > 3) {
      if (
        existingResumeName &&
        (existingResumeName === uploadedName ||
          (baseUploadedName.length >= 4 &&
            baseExistingName.length >= 4 &&
            (baseUploadedName === baseExistingName ||
              baseExistingName.includes(baseUploadedName) ||
              baseUploadedName.includes(baseExistingName))))
      ) {
        fileMatched = true;
        matchedDocName = candidate.resume_name || uploadedFile?.name || "CV Document";
      } else if (candidate.documents && candidate.documents.length > 0) {
        const foundDoc = candidate.documents.find((d) => {
          const dName = (d.name || "").trim().toLowerCase();
          const baseDName = dName.replace(/^(\d+[-_]|uuid[-_])/i, "").replace(/\.[^/.]+$/, "").trim();
          return (
            dName === uploadedName ||
            (baseUploadedName.length >= 4 && baseDName.length >= 4 && baseDName === baseUploadedName)
          );
        });
        if (foundDoc) {
          fileMatched = true;
          matchedDocName = foundDoc.name;
        }
      } else if (candidate.resume_url) {
        const decodedUrl = decodeURIComponent(candidate.resume_url).toLowerCase();
        if (
          decodedUrl.includes(uploadedName) ||
          (baseUploadedName.length >= 5 && decodedUrl.includes(baseUploadedName))
        ) {
          fileMatched = true;
          matchedDocName = candidate.resume_name || uploadedFile?.name || "CV Document";
        }
      }
    }

    // 2. Strong Match Check: Email or Phone (or found inside raw CV text)
    const emailDirectMatch = Boolean(normEmail && candEmail && normEmail === candEmail);
    const emailInText = Boolean(candEmail && candEmail.length > 5 && rawTextLower.includes(candEmail));
    const emailMatched = emailDirectMatch || emailInText;

    const phoneDirectMatch = Boolean(
      normPhone && candPhone && (normPhone === candPhone || normPhone.slice(-8) === candPhone.slice(-8))
    );
    const phoneInText = Boolean(
      candPhone && candPhone.length >= 8 && rawDigits.includes(candPhone.slice(-8))
    );
    const phoneMatched = phoneDirectMatch || phoneInText;

    if (fileMatched || emailMatched || phoneMatched) {
      const reasons: string[] = [];
      if (fileMatched) {
        reasons.push(`Identical CV file: "${matchedDocName}" already exists on candidate's record`);
      }
      if (emailMatched) {
        reasons.push(
          emailDirectMatch
            ? `Identical email address: ${candidate.email}`
            : `Candidate email found in uploaded CV: ${candidate.email}`
        );
      }
      if (phoneMatched) {
        reasons.push(
          phoneDirectMatch
            ? `Matching phone number: ${candidate.phone}`
            : `Candidate phone found in uploaded CV: ${candidate.phone}`
        );
      }

      const fieldMatches = [
        ...(fileMatched
          ? [
              {
                field: "resume_file",
                label: "CV Document File",
                isMatched: true,
                extractedValue: uploadedFile?.name || "Uploaded CV",
                existingValue: matchedDocName || "Existing Record",
                scoreContribution: "Identical File Match (100%)",
              },
            ]
          : []),
        {
          field: "email",
          label: "Email Address",
          isMatched: emailMatched,
          extractedValue: extracted.email || (emailInText ? candidate.email : undefined),
          existingValue: candidate.email,
          scoreContribution: "Strong match factor",
        },
        {
          field: "phone",
          label: "Phone Number",
          isMatched: phoneMatched,
          extractedValue: extracted.phone || (phoneInText ? candidate.phone : undefined),
          existingValue: candidate.phone || undefined,
          scoreContribution: "Strong match factor",
        },
        {
          field: "full_name",
          label: "Candidate Name",
          isMatched: stringSimilarity(extracted.full_name || "", candidate.full_name || "") > 0.8,
          extractedValue: extracted.full_name,
          existingValue: candidate.full_name,
        },
      ];

      return {
        isDuplicate: true,
        matchType: "strong",
        matchScore: 100,
        matchedCandidate: candidate,
        matchReasons: reasons,
        fieldMatches,
      };
    }

    // 2. Potential Match Check: Composite Score (Name, Company, Position, Dates, Education, Skills)
    let score = 0;
    const reasons: string[] = [];
    const fieldMatches: DuplicateMatchResult["fieldMatches"] = [];

    // Name similarity (weight: 40%)
    const nameSim = stringSimilarity(extracted.full_name || "", candidate.full_name || "");
    if (nameSim >= 0.75) {
      const pts = Math.round(nameSim * 40);
      score += pts;
      reasons.push(`High name similarity: "${extracted.full_name}" vs "${candidate.full_name}" (${Math.round(nameSim * 100)}%)`);
      fieldMatches.push({
        field: "full_name",
        label: "Full Name",
        isMatched: true,
        extractedValue: extracted.full_name,
        existingValue: candidate.full_name,
        scoreContribution: `+${pts}%`,
      });
    } else {
      fieldMatches.push({
        field: "full_name",
        label: "Full Name",
        isMatched: false,
        extractedValue: extracted.full_name,
        existingValue: candidate.full_name,
      });
    }

    // Previous company match (weight: 20%)
    const companyOverlap = hasOverlap(extracted.previous_companies, candidate.work_experience);
    if (companyOverlap) {
      score += 20;
      reasons.push("Matching previous employer/company mentioned in career history");
      fieldMatches.push({
        field: "previous_company",
        label: "Previous Company",
        isMatched: true,
        extractedValue: extracted.previous_companies?.slice(0, 2).join(", "),
        existingValue: candidate.work_experience?.slice(0, 80) || undefined,
        scoreContribution: "+20%",
      });
    }

    // Previous position match (weight: 15%)
    const positionOverlap = hasOverlap(extracted.previous_positions, candidate.work_experience);
    if (positionOverlap) {
      score += 15;
      reasons.push("Similar previous position / job title");
      fieldMatches.push({
        field: "previous_position",
        label: "Previous Job Position",
        isMatched: true,
        extractedValue: extracted.previous_positions?.slice(0, 2).join(", "),
        existingValue: candidate.work_experience?.slice(0, 80) || undefined,
        scoreContribution: "+15%",
      });
    }

    // Education match (weight: 15%)
    let eduMatch = false;
    if (extracted.education && candidate.education) {
      const eduSim = stringSimilarity(extracted.education, candidate.education);
      if (eduSim > 0.6) {
        eduMatch = true;
        score += 15;
        reasons.push("Matching university or degree qualification");
        fieldMatches.push({
          field: "education",
          label: "Education / Degree",
          isMatched: true,
          extractedValue: extracted.education,
          existingValue: candidate.education,
          scoreContribution: "+15%",
        });
      }
    }
    if (!eduMatch && (extracted.education || candidate.education)) {
      fieldMatches.push({
        field: "education",
        label: "Education / Degree",
        isMatched: false,
        extractedValue: extracted.education,
        existingValue: candidate.education || undefined,
      });
    }

    // Skills overlap (weight: 10%)
    const skillsScore = skillsOverlapScore(extracted.skills, candidate.skills);
    if (skillsScore >= 0.3) {
      const pts = Math.min(10, Math.round(skillsScore * 20));
      score += pts;
      reasons.push(`Common specialized skills overlap (${Math.round(skillsScore * 100)}%)`);
      fieldMatches.push({
        field: "skills",
        label: "Skills Overlap",
        isMatched: true,
        extractedValue: extracted.skills?.slice(0, 4).join(", "),
        existingValue: candidate.skills?.slice(0, 4).join(", "),
        scoreContribution: `+${pts}%`,
      });
    }

    // Cap score at 98 for potential matches (100 is reserved for strong phone/email matches)
    const finalScore = Math.min(98, score);

    // Potential match threshold: 60% or higher
    if (finalScore >= 60 && finalScore > bestMatch.matchScore) {
      bestMatch = {
        isDuplicate: true,
        matchType: "potential",
        matchScore: finalScore,
        matchedCandidate: candidate,
        matchReasons: reasons,
        fieldMatches,
      };
    }
  }

  return bestMatch;
}

/**
 * Queries all candidates directly from database to compare against the newly uploaded CV.
 * Ensures cross-branch and cross-job candidates with identical CVs/resumes are never missed.
 */
export async function queryCandidateDuplicates(
  file: File | null,
  extracted: ExtractedCvData,
  fallbackCandidates: Candidate[] = [],
  excludeCandidateId?: string | null
): Promise<DuplicateMatchResult> {
  try {
    const { data: dbCandidates } = await supabase
      .from("candidates")
      .select("*, job_postings(id, title, department, branch_id)")
      .is("deleted_at", null)
      .order("applied_at", { ascending: false });

    const pool = dbCandidates && dbCandidates.length > 0
      ? (dbCandidates as unknown as Candidate[])
      : fallbackCandidates;

    return findDuplicateCandidate(extracted, pool, excludeCandidateId, file);
  } catch (err) {
    console.warn("Failed to query database candidates for CV duplicate check, using local pool:", err);
    return findDuplicateCandidate(extracted, fallbackCandidates, excludeCandidateId, file);
  }
}
