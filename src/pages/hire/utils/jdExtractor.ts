import { extractTextFromPdf } from "./cvExtractor";

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
 * Normalizes headings by stripping leading numbering, bullets, roman numerals (e.g. "1.", "I.", "•")
 * Safe against stripping initial English letters (e.g. "Duties", "Candidate", "Manager")
 */
function cleanHeading(l: string): string {
  return l
    .replace(/^[\s#*_\-•●▪▫–—\t]+/, "")
    .replace(/^(?:(?:\d+|[ivxldcm]+)[.)\]\s:-]+)+/i, "")
    .replace(/^[\s#*_\-•●▪▫–—\t]+/, "")
    .replace(/[:#*_\-]+$/, "")
    .trim();
}

/**
 * Compound headings that are unambiguously section titles
 */
const COMPOUND_HEADINGS = [
  "Duties and Responsibilities",
  "Core Responsibilities & Duties",
  "Key Responsibilities & Duties",
  "Responsibilities & Duties",
  "Responsibilities and Duties",
  "Core Responsibilities",
  "Key Responsibilities",
  "Primary Responsibilities",
  "Required Qualifications",
  "Preferred Qualifications",
  "Basic Qualifications",
  "Minimum Qualifications",
  "Core Requirements & Skills",
  "Key Requirements & Skills",
  "Requirements & Skills",
  "Requirements and Skills",
  "Education & Qualifications",
  "Education and Qualifications",
  "Academic Qualifications",
  "Role Purpose & Mission",
  "Role Purpose and Mission",
  "Reporting Line & Supervision",
  "Reporting Line and Supervision",
  "Direct Reports to",
  "Direct Reports",
  "Supervised By",
  "Line Manager",
  "Role Purpose",
  "Job Purpose",
  "Role Summary",
  "Job Summary",
  "Position Summary",
  "Role Overview",
  "Job Overview",
  "General Description",
  "Position Information",
].sort((a, b) => b.length - a.length);

const COMPOUND_PATTERN = COMPOUND_HEADINGS.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

/**
 * Splits glued text, embedded headings, and labeled duty bullet points
 */
export function splitGluedText(text: string): string {
  if (!text) return "";

  let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // 1. Convert double/multiple spaces into newlines (universal sign of pasted text lines from LLMs, chat, Telegram, web)
  cleaned = cleaned.replace(/  +/g, "\n");

  // 2. Glued label splits: e.g. "OverviewRole:" -> "Overview\nRole:", "ResponsibilitiesWeb Development:" -> "Responsibilities\nWeb Development:", "ProfileEducation:" -> "Profile\nEducation:"
  cleaned = cleaned.replace(/([a-z0-9])([A-Z][a-zA-Z0-9\s&/]{1,30}:)/g, "$1\n$2");
  cleaned = cleaned.replace(
    /([a-z0-9])(Core Responsibilities|Key Responsibilities|Responsibilities|Required Skills|Candidate Profile|Education|Preferred|Reports To|Department|Working Schedule|Compensation)/gi,
    "$1\n$2"
  );

  // 3. Separate compound headings preceded by non-newline characters (e.g. "allowance  Core Responsibilities")
  const regexCompound = new RegExp(
    `(?<!(?:Core|Key|Primary|Role|Job|Position|Education|Required|Preferred|Duties)\\s*(?:&|and|/)?\\s*)([^\\n\\r\\s])\\s*\\b(${COMPOUND_PATTERN})\\b`,
    "gi"
  );
  cleaned = cleaned.replace(regexCompound, "$1\n$2");

  // 4. Separate compound headings glued directly to PascalCase words
  const regexAfterGlued = new RegExp(`\\b(${COMPOUND_PATTERN})([A-Z][a-z]+)`, "g");
  cleaned = cleaned.replace(regexAfterGlued, "$1\n$2");

  // 5. For single words (Requirements, Responsibilities, Qualifications, Education), ONLY split if followed by colon or standalone
  cleaned = cleaned.replace(/([^\n\r\s])\s*\b(Requirements|Responsibilities|Qualifications|Education)\s*:/gi, "$1\n$2:");

  // 6. Split labeled sub-items that are glued on one line (e.g. ". Code Quality: ... . Testing & QA: ...")
  cleaned = cleaned.replace(/([.!?])\s+([A-Z][A-Za-z0-9/&+\s]{2,28}:\s+[A-Z])/g, "$1\n• $2");

  return cleaned;
}

/**
 * Detects section type from a line
 */
function detectSectionType(
  rawLine: string
): "summary" | "responsibilities" | "requirements" | "qualifications" | "reporting_line" | "ignore" | null {
  const line = rawLine.trim();
  if (!line || line.length > 90) return null;

  // Administrative / Sign-off section terminators that should stop collecting content
  if (
    /^(?:benefit|benefits|allowance|approvals?|signatures?|acknowledged\s+by|head\s+of\s+department|date\s*:|prepared\s+by|approved\s+by|working\s+days|working\s+time|level\s*\/\s*grade|prepared\s+date|position\s+information|general\s+description|working\s+schedule|compensation)\b/i.test(
      line
    )
  ) {
    return "ignore";
  }

  const cleaned = cleanHeading(line).toLowerCase();
  if (!cleaned) return null;

  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount > 8) return null;

  // Reporting Line
  if (/^(?:reporting\s+line|direct\s+reports?\s+to|reports?\s+to|reporting\s+to|supervised\s+by|line\s+manager|direct\s+reports?)\b/i.test(cleaned)) {
    return "reporting_line";
  }

  // Summary / Purpose / Mission / Overview
  if (
    /^(?:job\s+summary|role\s+summary|position\s+summary|executive\s+summary|summary)\b/i.test(cleaned) ||
    /^(?:job\s+purpose|role\s+purpose|position\s+purpose|purpose\s+of\s+(?:the\s+)?(?:job|role|position)|purpose)\b/i.test(cleaned) ||
    /^(?:job\s+overview|role\s+overview|position\s+overview|overview)\b/i.test(cleaned) ||
    /^(?:role\s+mission|mission|role\s+objective|job\s+objective|objective|background|about\s+(?:the\s+)?(?:role|job|position|us))\b/i.test(cleaned) ||
    /^(?:job\s+description|position\s+description)\b/i.test(cleaned)
  ) {
    return "summary";
  }

  // Responsibilities / Duties
  if (
    /^(?:duties\s+(?:and|&)\s+responsibilities|core\s+responsibilities(?:\s+&\s+duties)?|key\s+responsibilities(?:\s+&\s+duties)?|responsibilities\s+(?:and|&)\s+duties|primary\s+responsibilities|essential\s+duties|key\s+duties|responsibilities|duties|accountabilities|what\s+you(?:'ll|\s+will)\s+do|scope\s+of\s+work)\b/i.test(
      cleaned
    )
  ) {
    return "responsibilities";
  }

  // Education / Qualifications
  if (
    /^(?:education\s+(?:and|&)\s+qualifications|educational\s+qualifications|educational\s+requirements|academic\s+qualifications|minimum\s+qualifications|preferred\s+qualifications|required\s+qualifications|basic\s+qualifications|education\s+(?:and|&)\s+experience|education|academic)\b/i.test(
      cleaned
    )
  ) {
    return "qualifications";
  }

  // Requirements / Skills / Profile
  if (
    /^(?:core\s+requirements(?:\s+&\s+skills)?|key\s+requirements|requirements\s+(?:and|&)\s+skills|skills\s+(?:and|&)\s+requirements|skills\s+(?:and|&)\s+experience|required\s+skills|core\s+skills|technical\s+skills|hard\s+skills|soft\s+skills|requirements|skills|competencies|what\s+we(?:'re|\s+are)\s+looking\s+for|candidate\s+profile|person\s+specification|prerequisites|must\s+have|who\s+you\s+are)\b/i.test(
      cleaned
    )
  ) {
    return "requirements";
  }

  return null;
}

/**
 * Normalizes lists of items to clean bullet points
 */
function formatBulletItems(items: string[]): string {
  if (!items || items.length === 0) return "";
  return items
    .map((item) => {
      const cleaned = item.replace(/^[\s#*_\-•●▪▫–—\t]+/, "").trim();
      return cleaned.startsWith("•") ? cleaned : `• ${cleaned}`;
    })
    .filter(
      (l) =>
        l.length > 2 &&
        !/^(?:•\s*)?(?:benefit|benefits|allowance|approvals?|signatures?|acknowledged\s+by|head\s+of\s+department|date\s*:|working\s+schedule|compensation)\b/i.test(l)
    )
    .join("\n");
}

/**
 * Parses XML text from word/document.xml preserving paragraph breaks, table cells, and text runs
 */
function xmlToDocxLines(xml: string): string[] {
  const lines: string[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, "application/xml");
    const paragraphs = doc.getElementsByTagName("w:p");

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      let pText = "";

      const walker = doc.createTreeWalker(p, NodeFilter.SHOW_ELEMENT, null);
      let currentNode = walker.nextNode();
      while (currentNode) {
        const el = currentNode as Element;
        const tagName = el.tagName.toLowerCase();
        if (tagName === "w:t") {
          const text = el.textContent || "";
          if (
            pText &&
            !pText.endsWith(" ") &&
            !pText.endsWith("\n") &&
            text &&
            !text.startsWith(" ") &&
            !text.startsWith(",") &&
            !text.startsWith(".") &&
            !text.startsWith(":") &&
            !text.startsWith(";")
          ) {
            pText += " ";
          }
          pText += text;
        } else if (tagName === "w:br" || tagName === "w:cr") {
          pText += "\n";
        } else if (tagName === "w:tab") {
          pText += " ";
        }
        currentNode = walker.nextNode();
      }

      const trimmed = pText.trim();
      if (trimmed) {
        lines.push(trimmed);
      }
    }

    if (lines.length > 0) {
      return lines;
    }
  } catch (e) {
    console.warn("DOMParser docx XML parse fallback:", e);
  }

  // Robust regex fallback: separate table cells, rows, and runs
  const normalizedXml = xml
    .replace(/<\/w:tc>/gi, "\n")
    .replace(/<\/w:tr>/gi, "\n")
    .replace(/<\/w:p>/gi, "\n")
    .replace(/<w:br[^>]*>/gi, "\n")
    .replace(/<w:cr[^>]*>/gi, "\n")
    .replace(/<w:tab[^>]*>/gi, " ")
    .replace(/<\/w:r>/gi, " ")
    .replace(/<w:t[^>]*>(.*?)<\/w:t>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");

  return normalizedXml
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Extracts plain text from DOCX files using browser-native zip extraction with paragraph preservation
 */
async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const textDecoder = new TextDecoder("utf-8");
    const docXmlStr = "word/document.xml";

    for (let i = 0; i < bytes.length - 30; i++) {
      if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x03 && bytes[i + 3] === 0x04) {
        const compMethod = bytes[i + 8] | (bytes[i + 9] << 8);
        const compSize = bytes[i + 18] | (bytes[i + 19] << 8) | (bytes[i + 20] << 16) | (bytes[i + 21] << 24);
        const nameLen = bytes[i + 26] | (bytes[i + 27] << 8);
        const extraLen = bytes[i + 28] | (bytes[i + 29] << 8);
        const nameBytes = bytes.subarray(i + 30, i + 30 + nameLen);
        const fileName = textDecoder.decode(nameBytes);

        if (fileName === docXmlStr) {
          const dataStart = i + 30 + nameLen + extraLen;
          let dataEnd = dataStart + compSize;

          if (!compSize || compSize <= 0 || dataEnd > bytes.length) {
            let nextPk = bytes.length;
            for (let j = dataStart; j < bytes.length - 4; j++) {
              if (bytes[j] === 0x50 && bytes[j + 1] === 0x4b && (bytes[j + 2] === 0x03 || bytes[j + 2] === 0x01 || bytes[j + 2] === 0x07)) {
                nextPk = j;
                break;
              }
            }
            dataEnd = nextPk;
          }

          const compressedData = bytes.subarray(dataStart, dataEnd);
          let xml = "";

          if (compMethod === 8 && typeof DecompressionStream !== "undefined") {
            try {
              const stream = new Response(compressedData).body?.pipeThrough(new DecompressionStream("deflate-raw"));
              xml = (await new Response(stream).text()) || "";
            } catch {
              try {
                const stream = new Response(compressedData).body?.pipeThrough(new DecompressionStream("deflate"));
                xml = (await new Response(stream).text()) || "";
              } catch {
                // Ignore and fall back to raw text decode
              }
            }
          }
          if (!xml) {
            xml = textDecoder.decode(compressedData);
          }

          const lines = xmlToDocxLines(xml);
          return lines.join("\n");
        }
      }
    }
  } catch (err) {
    console.warn("DOCX extraction fallback:", err);
  }
  return "";
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

    // 1. Position Title (same line or next line in table)
    if (!result.title && idx < 15) {
      if (/^(?:position\s+information|job\s+information|job\s+description(?:\s+form)?)/i.test(line)) {
        // Skip document header lines
      } else {
        const titleMatch = line.match(/^(?:job\s+title|position(?:\s+title)?|role(?:\s+title)?)\s*[:\-]?\s*(.*)$/i);
        if (titleMatch) {
          let rawVal = (titleMatch[1] || (nextLine && !nextLine.includes(":") ? nextLine : "")).trim();
          const listedMatch = rawVal.match(/job\s+title\s+listed\s+as\s+([^,)]+)/i);
          if (listedMatch) {
            rawVal = listedMatch[1].trim();
          } else if (rawVal.includes("(") && rawVal.includes(")")) {
            rawVal = rawVal.replace(/\([^)]*\)/g, "").trim();
          }
          const cleanVal = rawVal.replace(/\s+/g, " ");
          if (cleanVal && cleanVal.length > 2 && !/position\s+information|job\s+description|information\b|^overview$/i.test(cleanVal)) {
            result.title = cleanVal;
          }
        }
      }
    }

    // 2. Department / Division (same line or next line in table)
    if (!result.department && idx < 15) {
      const deptMatch = line.match(
        /^(?:division\s*\/\s*department|department\s*\/\s*division|department|division|dept)\s*[:\-]?\s*(.*)$/i
      );
      if (deptMatch) {
        const rawVal = (deptMatch[1] || (nextLine && !nextLine.includes(":") ? nextLine : "")).trim();
        const cleanVal = rawVal.replace(/\s+/g, " ");
        if (cleanVal && cleanVal.length > 1 && !/job\s+title|position/i.test(cleanVal)) {
          result.department = cleanVal;
        }
      }
    }

    // 3. Reporting line (same line or next line in table)
    if (!result.reporting_line && idx < 18) {
      const repMatch = line.match(
        /^(?:direct\s+reports?\s+to|reports?\s+to|reporting\s+to|supervised\s+by|line\s+manager|reporting\s+line)\s*[:\-]?\s*(.*)$/i
      );
      if (repMatch) {
        const rawVal = (repMatch[1] || (nextLine && !nextLine.includes(":") ? nextLine : "")).trim();
        const cleanVal = rawVal.replace(/\s+/g, " ");
        if (cleanVal && cleanVal.length > 1 && !/level|grade|type\s+of/i.test(cleanVal)) {
          result.reporting_line = cleanVal.toLowerCase().startsWith("reports to") ? cleanVal : `Reports to: ${cleanVal}`;
        }
      }
    }

    // 4. Employment Type
    if (!result.employment_type) {
      const low = line.toLowerCase();
      if (/\bintern(?:ship)?\b/i.test(low)) result.employment_type = "internship";
      else if (/\bfull[\s-]time\b/i.test(low)) result.employment_type = "full-time";
      else if (/\bpart[\s-]time\b/i.test(low)) result.employment_type = "part-time";
      else if (/\bcontract\b/i.test(low)) result.employment_type = "contract";
    }

    // 5. Salary Range
    const salaryMatch = line.match(
      /(?:salary|compensation|remuneration|pay\s+rate|expected\s+salary)\s*[:\-]?\s*([$¥€£]?\s*[\d,]+(?:\s*-\s*[$¥€£]?\s*[\d,]+)?)/i
    );
    if (salaryMatch && !result.salary_min) {
      const numbers = salaryMatch[1].replace(/,/g, "").match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        result.salary_min = numbers[0];
        result.salary_max = numbers[1];
      } else if (numbers && numbers.length === 1) {
        result.salary_min = numbers[0];
      }
    }

    // 6. Headcount
    const hcMatch = line.match(/^(?:headcount|vacanc(?:y|ies)|number\s+of\s+positions?|openings?)\s*[:\-]\s*(\d+)/i);
    if (hcMatch && !result.headcount) {
      result.headcount = parseInt(hcMatch[1], 10) || 1;
      continue;
    }

    // 7. Location
    const locMatch = line.match(/^(?:location|work\s+location|duty\s+station|work\s+place|based\s+in)\s*[:\-]\s*(.+)$/i);
    if (locMatch && !result.location) {
      result.location = locMatch[1].trim();
      continue;
    }

    // 8. Justification / Business Need
    const justMatch = line.match(/^(?:reason\s+for\s+hiring|business\s+need|justification|position\s+rational)\s*[:\-]\s*(.+)$/i);
    if (justMatch && !result.justification) {
      result.justification = justMatch[1].trim();
      continue;
    }

    // 9. Section Heading detection
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

    // Handle administrative stop lines
    if (detectedKey === "ignore") {
      currentSection = "none";
      continue;
    }

    if (detectedKey) {
      currentSection = detectedKey;
      if (inlineContent) {
        if (detectedKey === "reporting_line") {
          result.reporting_line = inlineContent;
        } else {
          sectionContent[detectedKey].push(inlineContent);
        }
      }
      continue;
    }

    // Smart distribution between Qualifications (Education) and Requirements (Skills)
    if (currentSection === "qualifications" || currentSection === "requirements") {
      const isEducation =
        /^(?:•|\*|-)?\s*(?:currently\s+pursuing|completed\s+an|bachelor|master|degree|diploma|associate|phd|high\s+school|certified|certification|academic|education)\b/i.test(
          line
        );
      if (isEducation) {
        sectionContent.qualifications.push(line);
      } else {
        sectionContent.requirements.push(line);
      }
      continue;
    }

    if (currentSection !== "none") {
      sectionContent[currentSection].push(line);
    } else {
      sectionContent.none.push(line);
    }
  }

  // Fallback semantic classification if explicit headings were missing
  if (sectionContent.responsibilities.length === 0 || sectionContent.requirements.length === 0) {
    for (const line of sectionContent.none) {
      const repMatch = line.match(/(?:reports?\s+to|reporting\s+to|direct\s+report|supervised\s+by)\s*[:\-]\s*(.+)$/i);
      if (repMatch && !result.reporting_line) {
        result.reporting_line = repMatch[1].trim();
        continue;
      }

      if (/^(?:•|\*|-|▪|▫|\d+[.)])?\s*(?:manage|develop|design|build|lead|implement|coordinate|create|maintain|ensure|provide|conduct|oversee|prepare|execute|test|support|deliver|collaborate|review|operate|monitor)\b/i.test(line)) {
        sectionContent.responsibilities.push(line);
      } else if (/^(?:•|\*|-|▪|▫|\d+[.)])?\s*(?:bachelor|master|degree|diploma|certified|certification|high\s+school|graduat|phd|associate)\b/i.test(line)) {
        sectionContent.qualifications.push(line);
      } else if (/^(?:•|\*|-|▪|▫|\d+[.)])?\s*(?:\d+\+?\s*years?|experience|proficien|knowledge|strong|skills|familiar|ability|understanding|fluent|proven\s+track|deep\s+understanding)\b/i.test(line)) {
        sectionContent.requirements.push(line);
      } else if (
        line.length > 25 &&
        !/^(?:department|location|company|date|prepared\s+by|approved\s+by|level|salary|status|allowance|benefit)\s*[:\-]/i.test(line)
      ) {
        if (sectionContent.summary.length < 3) {
          sectionContent.summary.push(line);
        }
      }
    }
  }

  // Infer title from filename if still missing
  if (!result.title && filename) {
    const rawName = filename.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
    if (rawName && !/job\s*description|jd|spec/i.test(rawName)) {
      result.title = rawName;
    } else {
      result.title = rawName.replace(/\b(?:job\s*description|jd|specification|role)\b/gi, "").trim();
    }
  }

  // Summary: filter metadata lines (Role:, Department:, Reports To:, etc.)
  const cleanSummaryLines = sectionContent.summary.filter(
    (l) => !/^(?:role|job\s+title|position|department|division|reports?\s+to|reporting\s+to|working\s+schedule|compensation|allowance)\s*[:\-]/i.test(l)
  );

  // Clean fallback summary: exclude allowance or isolated non-sentence fragments
  const fallbackSummary = sectionContent.none
    .filter(
      (l) =>
        l.length > 30 &&
        !/^(?:department|location|company|date|prepared\s+by|approved\s+by|level|salary|status|allowance|benefit|position\s+information|reports?\s+to|working\s+schedule|compensation|role)\s*[:\-]/i.test(
          l
        ) &&
        !/^(?:based\s+on\s+the\s+document|here\s+is\s+a\s+breakdown)/i.test(l)
    )
    .slice(0, 3)
    .join("\n")
    .trim();

  result.job_summary = cleanSummaryLines.join("\n").trim() || fallbackSummary;

  // If job summary is still empty, synthesize an elegant role mission from title and department
  if (!result.job_summary && result.title) {
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

