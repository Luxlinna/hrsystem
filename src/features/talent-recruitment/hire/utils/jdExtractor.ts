import { extractTextFromPdf } from "./cvExtractor";
import { extractTextFromDocx } from "./docxExtractor";
import {
  splitGluedText,
  detectSectionType,
  formatBulletItems,
} from "./jdSectionRules";
import { applySemanticFallback } from "./jdSemanticFallback";
import { extractInlineMetadata } from "./jdMetadataExtractor";

export interface ExtractedJdData {
  title?: string;
  department?: string;
  division?: string;
  employment_type?: string;
  salary_min?: string;
  salary_max?: string;
  headcount?: number;
  justification?: string;
  location?: string;
  job_summary: string;
  responsibilities: string;
  requirements: string;
  qualifications: string;
  reporting_line: string;
  rawText: string;
}

/**
 * Parses raw text into structured JD sections and requisition metadata
 */
export function heuristicExtractJd(rawText: string, filename?: string): ExtractedJdData {
  const preparedText = splitGluedText(rawText);
  const lines = preparedText.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  const result: ExtractedJdData = {
    job_summary: "",
    responsibilities: "",
    requirements: "",
    qualifications: "",
    reporting_line: "",
    rawText,
  };

  type SectionKey = "summary" | "responsibilities" | "requirements" | "qualifications" | "reporting_line" | "none";
  let currentSection: SectionKey = "none";
  const sectionContent: Record<SectionKey, string[]> = {
    summary: [],
    responsibilities: [],
    requirements: [],
    qualifications: [],
    reporting_line: [],
    none: [],
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const nextLine = idx + 1 < lines.length ? lines[idx + 1] : "";

    // Extract inline metadata (Title, Dept, Salary, etc.)
    const shouldSkip = extractInlineMetadata(line, nextLine, idx, result);
    if (shouldSkip) continue;

    // Section Heading detection FIRST (takes priority over inline patterns)
    let detectedKey = detectSectionType(line);
    let inlineContent = "";

    if (!detectedKey && line.includes(":")) {
      const colonIdx = line.indexOf(":");
      const beforeColon = line.substring(0, colonIdx).trim();
      const maybeSection = detectSectionType(beforeColon);
      if (maybeSection) {
        detectedKey = maybeSection;
        inlineContent = line.substring(colonIdx + 1).trim();
      }
    }

    if (detectedKey === "ignore") {
      currentSection = "none";
      continue;
    }

    if (detectedKey) {
      currentSection = detectedKey;
      if (inlineContent) {
        if (detectedKey === "reporting_line") result.reporting_line = inlineContent;
        else sectionContent[detectedKey].push(inlineContent);
      }
      continue;
    }

    // Inline Reporting line check (only if not a section heading)
    if (!result.reporting_line && /^(?:direct\s+reports?\s+to|reports?\s+to|reporting\s+to|supervised\s+by|line\s+manager)\s*[:\-]?\s*(.+)$/i.test(line)) {
      const repMatch = line.match(/^(?:direct\s+reports?\s+to|reports?\s+to|reporting\s+to|supervised\s+by|line\s+manager)\s*[:\-]?\s*(.+)$/i);
      if (repMatch) {
        const cleanVal = repMatch[1].trim().replace(/\s+/g, " ");
        if (cleanVal && !cleanVal.toLowerCase().includes("supervision")) {
          result.reporting_line = cleanVal.toLowerCase().startsWith("reports to") ? cleanVal : `Reports to: ${cleanVal}`;
          continue;
        }
      }
    }

    if (currentSection === "reporting_line") {
      const repVal = line.replace(/^(?:reports?\s+to|reporting\s+to|direct\s+reports?\s+to)\s*[:\-]?\s*/i, "").trim();
      if (repVal && !result.reporting_line) result.reporting_line = `Reports to: ${repVal}`;
      else if (repVal) sectionContent.reporting_line.push(line);
      continue;
    }

    if (currentSection !== "none") sectionContent[currentSection].push(line);
    else sectionContent.none.push(line);
  }

  applySemanticFallback(sectionContent, result);

  if (!result.title && filename && rawText.trim()) {
    const rawName = filename.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
    result.title = /job\s*description|jd|spec/i.test(rawName) ? rawName.replace(/\b(?:job\s*description|jd|specification|role)\b/gi, "").trim() : rawName;
  }

  const cleanSummaryLines = sectionContent.summary.filter(
    (l) => !/^(?:role|job\s+title|position|department|division|reports?\s+to|reporting\s+to|working\s+schedule|compensation|allowance)\s*[:\-]/i.test(l) &&
           !/^(?:1|2|3|4|5)[.)]?\s*$/i.test(l)
  );

  const fallbackSummary = sectionContent.none
    .filter((l) => l.length > 30 && !/^(?:department|location|company|date|prepared\s+by|approved\s+by|level|salary|status|allowance|benefit|position\s+information|reports?\s+to|working\s+schedule|compensation|role)\s*[:\-]/i.test(l))
    .slice(0, 3)
    .join("\n")
    .trim();

  result.job_summary = cleanSummaryLines.join("\n").trim() || fallbackSummary;

  if (!result.job_summary && result.title && rawText.trim()) {
    const deptPhrase = result.department ? ` within the ${result.department} department` : "";
    result.job_summary = `Responsible for driving and executing ${result.title} objectives${deptPhrase}, delivering quality results, and collaborating with cross-functional team members to achieve operational excellence.`;
  }

  result.responsibilities = formatBulletItems(sectionContent.responsibilities);
  result.requirements = formatBulletItems(sectionContent.requirements);
  result.qualifications = formatBulletItems(sectionContent.qualifications);

  if (sectionContent.reporting_line.length > 0 && !result.reporting_line) {
    result.reporting_line = sectionContent.reporting_line.join(", ").trim();
  }

  return result;
}

/**
 * Extracts structured JD data directly from an uploaded file (PDF, DOCX, TXT, MD)
 */
export async function extractJdFromFile(file: File): Promise<ExtractedJdData> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  let text = "";

  if (ext === "pdf") {
    text = await extractTextFromPdf(file);
  } else if (ext === "docx") {
    text = await extractTextFromDocx(file);
  } else {
    text = await file.text().catch(() => "");
  }

  return heuristicExtractJd(text, file.name);
}
