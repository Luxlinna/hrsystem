import type { ExtractedJdData } from "./jdExtractor";

type SectionKey = "summary" | "responsibilities" | "requirements" | "qualifications" | "reporting_line" | "none";

/**
 * Fallback semantic classification if explicit headings were missing
 */
export function applySemanticFallback(
  sectionContent: Record<SectionKey, string[]>,
  result: ExtractedJdData
) {
  if (sectionContent.responsibilities.length > 0 && sectionContent.requirements.length > 0) {
    return;
  }

  for (const line of sectionContent.none) {
    const repMatch = line.match(/(?:reports?\s+to|reporting\s+to|direct\s+report|supervised\s+by)\s*[:\-]\s*(.+)$/i);
    if (repMatch && !result.reporting_line) {
      result.reporting_line = `Reports to: ${repMatch[1].trim()}`;
      continue;
    }

    if (
      /^(?:•|\*|-|▪|▫|\d+[.)])?\s*(?:manage|develop|design|build|lead|implement|coordinate|create|maintain|ensure|provide|conduct|oversee|prepare|execute|test|support|deliver|collaborate|review|operate|monitor)\b/i.test(
        line
      )
    ) {
      sectionContent.responsibilities.push(line);
    } else if (
      /^(?:•|\*|-|▪|▫|\d+[.)])?\s*(?:bachelor|master|degree|diploma|certified|certification|high\s+school|graduat|phd|associate)\b/i.test(
        line
      )
    ) {
      sectionContent.qualifications.push(line);
    } else if (
      /^(?:•|\*|-|▪|▫|\d+[.)])?\s*(?:\d+\+?\s*years?|experience|proficien|knowledge|strong|skills|familiar|ability|understanding|fluent|proven\s+track|deep\s+understanding)\b/i.test(
        line
      )
    ) {
      sectionContent.requirements.push(line);
    } else if (
      line.length > 25 &&
      !/^(?:department|location|company|date|prepared\s+by|approved\s+by|level|salary|status|allowance|benefit)\s*[:\-]/i.test(
        line
      )
    ) {
      if (sectionContent.summary.length < 3) {
        sectionContent.summary.push(line);
      }
    }
  }
}
