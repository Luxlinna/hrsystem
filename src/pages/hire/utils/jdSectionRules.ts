/**
 * Normalizes headings by stripping leading numbering, bullets, roman numerals (e.g. "1.", "I.", "•")
 */
export function cleanHeading(l: string): string {
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
export const COMPOUND_HEADINGS = [
  "Core Responsibilities & Duties",
  "Key Responsibilities & Duties",
  "Responsibilities & Duties",
  "Duties and Responsibilities",
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
].sort((a, b) => b.length - a.length);

export const COMPOUND_PATTERN = COMPOUND_HEADINGS.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");

/**
 * Splits glued text and embedded headings
 */
export function splitGluedText(text: string): string {
  if (!text) return "";

  let cleaned = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  const regexCompound = new RegExp(
    `([.!?])\\s*\\b(${COMPOUND_PATTERN})\\b`,
    "gi"
  );
  cleaned = cleaned.replace(regexCompound, "$1\n$2");

  cleaned = cleaned.replace(/([.!?])\s*\b(Requirements|Responsibilities|Qualifications|Education)\s*:/gi, "$1\n$2:");

  return cleaned;
}

/**
 * Detects section type from a line
 */
export function detectSectionType(
  rawLine: string
): "summary" | "responsibilities" | "requirements" | "qualifications" | "reporting_line" | "ignore" | null {
  const line = rawLine.trim();
  if (!line || line.length > 90) return null;

  const cleaned = cleanHeading(line).toLowerCase();
  if (!cleaned) return null;

  if (
    /^(?:benefits?|compensation|allowance|approvals?|signatures?|acknowledged\s+by|head\s+of\s+department|approved\s+by|prepared\s+by)\b/i.test(
      cleaned
    )
  ) {
    return "ignore";
  }

  const wordCount = cleaned.split(/\s+/).length;
  if (wordCount > 10) return null;

  // 1. Reporting Line & Supervision
  if (
    /^(?:reporting\s+line(?:\s+(?:&|and)\s+supervision)?|reporting\s+line|supervision|reports?\s+to\s+hierarchy|reporting\s+structure)\b/i.test(
      cleaned
    )
  ) {
    return "reporting_line";
  }

  // 2. Summary / Purpose / Mission
  if (
    /^(?:role\s+purpose(?:\s+(?:&|and)\s+mission)?|job\s+purpose|role\s+mission|purpose\s+of\s+(?:the\s+)?(?:job|role|position)|purpose)\b/i.test(
      cleaned
    ) ||
    /^(?:job\s+summary|role\s+summary|position\s+summary|executive\s+summary|general\s+description|summary)\b/i.test(cleaned) ||
    /^(?:job\s+overview|role\s+overview|position\s+overview|overview|background|about\s+(?:the\s+)?(?:role|job|position|us)|mission|objective)\b/i.test(
      cleaned
    )
  ) {
    return "summary";
  }

  // 3. Responsibilities / Duties
  if (
    /^(?:key\s+responsibilities(?:\s+(?:&|and)\s+duties)?|core\s+responsibilities(?:\s+(?:&|and)\s+duties)?|duties\s+(?:and|&)\s+responsibilities|responsibilities\s+(?:and|&)\s+duties|primary\s+responsibilities|essential\s+duties|key\s+duties|responsibilities|duties|accountabilities|what\s+you(?:'ll|\s+will)\s+do|scope\s+of\s+work|main\s+tasks|tasks)\b/i.test(
      cleaned
    )
  ) {
    return "responsibilities";
  }

  // 4. Education & Qualifications
  if (
    /^(?:education(?:\s+(?:&|and)\s+qualifications)?|educational\s+qualifications|educational\s+requirements|academic\s+qualifications|academic\s+background|qualifications|minimum\s+qualifications|preferred\s+qualifications|required\s+qualifications|basic\s+qualifications|credentials)\b/i.test(
      cleaned
    )
  ) {
    return "qualifications";
  }

  // 5. Requirements & Skills
  if (
    /^(?:core\s+requirements(?:\s+(?:&|and)\s+skills)?|key\s+requirements|requirements(?:\s+(?:&|and)\s+skills)?|skills(?:\s+(?:&|and)\s+requirements)?|skills\s+(?:and|&)\s+experience|required\s+skills|core\s+skills|technical\s+skills|requirements|skills|competencies|what\s+we(?:'re|\s+are)\s+looking\s+for|candidate\s+profile|person\s+specification|prerequisites|must\s+have|who\s+you\s+are)\b/i.test(
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
export function formatBulletItems(items: string[]): string {
  if (!items || items.length === 0) return "";
  return items
    .map((item) => {
      const cleaned = item.replace(/^[\s#*_\-•●▪▫–—\t]+/, "").trim();
      return cleaned.startsWith("•") ? cleaned : `• ${cleaned}`;
    })
    .filter(
      (l) =>
        l.length > 2 &&
        !/^(?:•\s*)?(?:\d+[.)]|approvals?|signatures?|acknowledged\s+by|head\s+of\s+department|date\s*:)\b/i.test(l) &&
        !/^(?:•\s*)?(?:1|2|3|4|5)[.)]?\s*$/i.test(l)
    )
    .join("\n");
}
