import type { ExtractedJdData } from "./jdExtractor";
import { detectSectionType } from "./jdSectionRules";

export function extractInlineMetadata(
  line: string,
  nextLine: string,
  idx: number,
  result: ExtractedJdData
): boolean {
  // 1. Position Title (same line or next line in table)
  if (!result.title && idx < 15 && !detectSectionType(line)) {
    if (/^(?:position\s+information|job\s+information|job\s+description(?:\s+form)?)$/i.test(line)) {
      return true;
    }
    const titleMatch = line.match(/^(?:job\s+title|position(?:\s+title)?|role\s+title)\s*[:\-]?\s*(.*)$/i);
    if (titleMatch) {
      let rawVal = (titleMatch[1] || (nextLine && !nextLine.includes(":") ? nextLine : "")).trim();
      if (rawVal.includes("(") && rawVal.includes(")")) rawVal = rawVal.replace(/\([^)]*\)/g, "").trim();
      const cleanVal = rawVal.replace(/\s+/g, " ");
      if (cleanVal && cleanVal.length > 2 && !/position\s+information|job\s+description|information\b|^overview$/i.test(cleanVal)) {
        result.title = cleanVal;
      }
    }
  }

  // 2. Department / Division
  if (!result.department && idx < 15) {
    const deptMatch = line.match(/^(?:division\s*\/\s*department|department\s*\/\s*division|department|division|dept)\s*[:\-]?\s*(.*)$/i);
    if (deptMatch) {
      const rawVal = (deptMatch[1] || (nextLine && !nextLine.includes(":") ? nextLine : "")).trim();
      const cleanVal = rawVal.replace(/\s+/g, " ");
      if (cleanVal && cleanVal.length > 1 && !/job\s+title|position/i.test(cleanVal)) {
        result.department = cleanVal;
      }
    }
  }

  // 3. Employment Type
  if (!result.employment_type) {
    const low = line.toLowerCase();
    if (/\bintern(?:ship)?\b/i.test(low)) result.employment_type = "internship";
    else if (/\bfull[\s-]time\b/i.test(low)) result.employment_type = "full-time";
    else if (/\bpart[\s-]time\b/i.test(low)) result.employment_type = "part-time";
    else if (/\bcontract\b/i.test(low)) result.employment_type = "contract";
  }

  // 4. Salary Range
  const salaryMatch = line.match(/(?:salary|compensation|remuneration|pay\s+rate|expected\s+salary)\s*[:\-]?\s*([$¥€£]?\s*[\d,]+(?:\s*-\s*[$¥€£]?\s*[\d,]+)?)/i);
  if (salaryMatch && !result.salary_min) {
    const numbers = salaryMatch[1].replace(/,/g, "").match(/\d+/g);
    if (numbers && numbers.length >= 2) {
      result.salary_min = numbers[0];
      result.salary_max = numbers[1];
    } else if (numbers && numbers.length === 1) {
      result.salary_min = numbers[0];
    }
  }

  // 5. Headcount, Location, Justification
  const hcMatch = line.match(/^(?:headcount|vacanc(?:y|ies)|number\s+of\s+positions?|openings?)\s*[:\-]\s*(\d+)/i);
  if (hcMatch && !result.headcount) {
    result.headcount = parseInt(hcMatch[1], 10) || 1;
    return true;
  }

  const locMatch = line.match(/^(?:location|work\s+location|duty\s+station|work\s+place|based\s+in)\s*[:\-]\s*(.+)$/i);
  if (locMatch && !result.location) {
    result.location = locMatch[1].trim();
    return true;
  }

  const justMatch = line.match(/^(?:reason\s+for\s+hiring|business\s+need|justification|position\s+rational)\s*[:\-]\s*(.+)$/i);
  if (justMatch && !result.justification) {
    result.justification = justMatch[1].trim();
    return true;
  }

  return false;
}
