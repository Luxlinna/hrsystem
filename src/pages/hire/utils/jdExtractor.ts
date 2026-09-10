import { extractTextFromPdf } from "./cvExtractor";

export interface ExtractedJdData {
  title?: string;
  job_summary: string;
  responsibilities: string;
  requirements: string;
  qualifications: string;
  reporting_line: string;
  rawText: string;
}

const SECTION_PATTERNS = {
  summary: /^(?:job\s+summary|about\s+the\s+role|role\s+summary|position\s+summary|overview|role\s+overview|job\s+purpose|summary|about\s+us|purpose\s+of\s+the\s+role)\b/i,
  responsibilities: /^(?:responsibilities|duties|key\s+responsibilities|core\s+responsibilities|role\s+responsibilities|duties\s+and\s+responsibilities|what\s+you(?:'ll|\s+will)\s+do|essential\s+duties|key\s+tasks|primary\s+duties)\b/i,
  requirements: /^(?:requirements|key\s+requirements|skills\s+and\s+requirements|skills\s+required|what\s+we(?:'re|\s+are)\s+looking\s+for|prerequisites|profile|core\s+competencies|competencies|skills|must\s+haves)\b/i,
  qualifications: /^(?:qualifications|education|educational\s+qualifications|education\s+and\s+experience|qualifications\s+and\s+experience|minimum\s+qualifications|preferred\s+qualifications|credentials)\b/i,
  reporting_line: /^(?:reporting\s+line|reports\s+to|reporting\s+to|direct\s+report|supervised\s+by)\b/i,
};

function cleanLine(l: string): string {
  return l.replace(/^[#*_\-•\t ]+/, "").replace(/[:#*_\-]+$/, "").trim();
}

/**
 * Extracts plain text from DOCX files using browser-native zip extraction
 */
async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const textDecoder = new TextDecoder("utf-8");
    const docXmlStr = "word/document.xml";

    // Search for word/document.xml filename in zip local headers
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
          const compressedData = bytes.subarray(dataStart, dataStart + compSize);
          let xml = "";

          if (compMethod === 8 && typeof DecompressionStream !== "undefined") {
            const stream = new Response(compressedData).body?.pipeThrough(new DecompressionStream("deflate-raw"));
            xml = await new Response(stream).text();
          } else {
            xml = textDecoder.decode(compressedData);
          }

          // Extract text from <w:t> tags
          const textMatches = xml.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
          return textMatches.map((t) => t.replace(/<[^>]+>/g, "")).join(" ");
        }
      }
    }
  } catch (err) {
    console.warn("DOCX extraction fallback:", err);
  }
  return "";
}

/**
 * Parses raw text into structured JD sections
 */
export function heuristicExtractJd(rawText: string): ExtractedJdData {
  const lines = rawText.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
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
    const cleaned = cleanLine(line);

    // Check title on first few lines if not set
    if (!result.title && idx < 5) {
      const titleMatch = line.match(/^(?:job\s+title|position(?:\s+title)?|role)\s*[:\-]\s*(.+)$/i);
      if (titleMatch) {
        result.title = titleMatch[1].trim();
        continue;
      }
      if (idx === 0 && line.length > 3 && line.length < 60 && !line.includes(":") && !/job\s+description/i.test(line)) {
        result.title = cleaned;
        continue;
      }
    }

    // Check inline reporting line
    const repMatch = line.match(/(?:reporting\s+line|reports\s+to|reporting\s+to|direct\s+report)\s*[:\-]\s*(.+)$/i);
    if (repMatch) {
      result.reporting_line = repMatch[1].trim();
      continue;
    }

    // Match section headers
    let matchedKey: SectionKey | null = null;
    for (const [key, pattern] of Object.entries(SECTION_PATTERNS)) {
      if (pattern.test(cleaned)) {
        matchedKey = key as SectionKey;
        break;
      }
    }

    if (matchedKey) {
      currentSection = matchedKey;
      continue;
    }

    if (currentSection !== "none") {
      sectionContent[currentSection].push(line);
    } else {
      sectionContent.none.push(line);
    }
  }

  result.job_summary = sectionContent.summary.join("\n").trim() || sectionContent.none.slice(0, 3).join("\n").trim();
  result.responsibilities = sectionContent.responsibilities.join("\n").trim();
  result.requirements = sectionContent.requirements.join("\n").trim();
  result.qualifications = sectionContent.qualifications.join("\n").trim();
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

  return heuristicExtractJd(text);
}
