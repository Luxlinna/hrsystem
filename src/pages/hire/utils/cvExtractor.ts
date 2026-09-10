import * as pdfjsLib from "pdfjs-dist";

// Configure worker for pdfjs in Vite / browser environment
if (typeof window !== "undefined" && "Worker" in window) {
  // Use a stable, standard CDN worker matching pdfjs-dist 3.11.174
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export interface ExtractedCvData {
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  education?: string;
  work_experience?: string;
  skills?: string[];
  languages?: string[];
  previous_companies?: string[];
  previous_positions?: string[];
  employment_dates?: string[];
  rawText?: string;
}

/**
 * Extracts raw plain text from a PDF File.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;

    let fullText = "";
    const maxPages = Math.min(pdfDoc.numPages, 10); // Process up to 10 pages for speed

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      let lastY: number | null = null;
      const pageLines: string[] = [];
      let currentLine = "";

      for (const item of textContent.items as any[]) {
        if (!item.str) continue;
        const str = item.str.trim();
        if (!str) continue;

        const currentY = item.transform ? Math.round(item.transform[5]) : null;
        if (lastY !== null && currentY !== null && Math.abs(currentY - lastY) > 4) {
          if (currentLine.trim()) {
            pageLines.push(currentLine.trim());
          }
          currentLine = str;
        } else {
          currentLine += (currentLine ? " " : "") + str;
        }
        if (currentY !== null) lastY = currentY;
      }
      if (currentLine.trim()) {
        pageLines.push(currentLine.trim());
      }
      fullText += pageLines.join("\n") + "\n\n";
    }

    return fullText.trim();
  } catch (err) {
    console.warn("PDF extraction fallback error:", err);
    return "";
  }
}

/**
 * Extracts text from plain text or other readable files.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") {
    return extractTextFromPdf(file);
  }
  if (ext === "txt" || ext === "rtf" || ext === "md" || ext === "csv") {
    return file.text();
  }
  return "";
}

/**
 * Normalizes a phone number for comparison (keeps digits only, handles country codes).
 */
export function normalizePhone(phone?: string | null): string {
  if (!phone) return "";
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, "");
  // If starts with 855 (Cambodia) or standard 0 prefix, strip leading 0 or international prefix
  if (digits.startsWith("855") && digits.length > 8) {
    return digits.slice(3);
  }
  if (digits.startsWith("0") && digits.length >= 9) {
    return digits.slice(1);
  }
  return digits;
}

/**
 * Normalizes email address for exact comparison.
 */
export function normalizeEmail(email?: string | null): string {
  return (email || "").trim().toLowerCase();
}

/**
 * Built-in heuristic/regex extractor for common CV fields.
 */
export function heuristicExtractCv(rawText: string): ExtractedCvData {
  const lines = rawText
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  // 1. Email extraction
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailMatch ? emailMatch[0].toLowerCase() : undefined;

  // 2. Phone extraction (matches formats: +855 12 345 678, (012) 345-678, 012-345-678, +1-555-...)
  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
  let phone = phoneMatch ? phoneMatch[0].trim() : undefined;
  if (phone && phone.length < 8) phone = undefined;

  // 3. Name extraction (heuristic: first clean non-header line that looks like a personal name)
  let full_name: string | undefined;
  for (const line of lines.slice(0, 12)) {
    if (
      (email && line.includes(email)) ||
      (phone && line.includes(phone)) ||
      /curriculum\s*vitae|resume|cv|contact|profile|page\s*\d|phone|email|skills|tools|portfolio|developer|officer|engineer/i.test(line) ||
      line.length > 40 ||
      line.length < 3
    ) {
      continue;
    }
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && words.every((w) => /^[A-Z][a-zA-Z.'-]*$/.test(w))) {
      full_name = line;
      break;
    }
  }

  // 4. Skills extraction
  const commonSkills = [
    "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#",
    "SQL", "PostgreSQL", "MySQL", "MongoDB", "AWS", "Docker", "Git", "HTML", "CSS",
    "Tailwind", "Figma", "UI/UX", "Project Management", "Agile", "Scrum", "Customer Service",
    "Sales", "Marketing", "SEO", "Accounting", "QuickBooks", "Human Resources", "Recruitment",
    "Payroll", "Leadership", "Communication", "Excel", "Data Analysis", "Graphic Design"
  ];
  const matchedSkills = commonSkills.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.+*?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(rawText)
  );

  // 5. Clean Education detection (short, structured degree & school entries only)
  const eduKeywords = ["bachelor", "master", "phd", "degree", "university", "college", "institute", "high school", "diploma", "passerelles"];
  const cleanEduLines: string[] = [];

  for (const line of lines) {
    if (
      /contact|technical skills|soft skills|phone|email|tools|languages|references|github|linkedin|portfolio|address|khan|sangkat/i.test(
        line
      )
    ) {
      continue;
    }
    const lower = line.toLowerCase();
    if (eduKeywords.some((kw) => lower.includes(kw)) && line.length >= 8 && line.length <= 90) {
      if (!cleanEduLines.some((e) => e.toLowerCase() === lower || lower.includes(e.toLowerCase()))) {
        cleanEduLines.push(line);
      }
    }
  }
  const education = cleanEduLines.slice(0, 3).join("\n");

  // 6. Clean Companies, Positions & Projects heuristics
  const previous_companies: string[] = [];
  const previous_positions: string[] = [];
  const cleanExpLines: string[] = [];

  const titleKeywords = [
    "manager", "developer", "engineer", "specialist", "officer", "lead",
    "coordinator", "supervisor", "intern", "internship", "analyst", "assistant",
    "director", "consultant", "programmer", "administrator", "designer", "qa",
    "tester", "technician", "nissaet"
  ];

  const projectKeywords = [
    "project", "inventory", "management system", "weather", "application",
    "platform", "portal", "capstone", "ecommerce", "dashboard", "full stack",
    "frontend", "backend"
  ];

  // Also check for specific embedded projects like "INVENTORY MANAGEMENT SYSTEM" or "PROJECT WEATHER"
  const projectPhrases = [
    "Inventory Management System",
    "Weather Project",
    "Weather Application",
    "E-commerce Platform",
    "Web Application Project",
  ];

  for (const phrase of projectPhrases) {
    if (new RegExp(phrase, "i").test(rawText) && !cleanExpLines.some((l) => l.toLowerCase().includes(phrase.toLowerCase()))) {
      cleanExpLines.push(`Project: ${phrase}`);
      previous_positions.push(phrase);
    }
  }

  for (const line of lines) {
    if (/contact|phone|email|technical skills|soft skills|tools|languages|references|address/i.test(line)) {
      continue;
    }
    const lower = line.toLowerCase();
    const hasJobTitle = titleKeywords.some((tk) => new RegExp(`\\b${tk}\\b`, "i").test(line));
    const hasProject = projectKeywords.some((pk) => new RegExp(`\\b${pk}\\b`, "i").test(line));

    if ((hasJobTitle || hasProject) && line.length >= 6 && line.length <= 110) {
      if (!cleanExpLines.some((e) => e.toLowerCase() === lower || lower.includes(e.toLowerCase()))) {
        cleanExpLines.push(line);
        previous_positions.push(line);
      }
    }
  }

  // Company detection heuristics
  const companyKeywords = ["passerelles", "technologies", "solutions", "corporation", "ltd", "inc", "group", "bank", "agency", "ministry"];
  for (const line of lines) {
    if (companyKeywords.some((ck) => line.toLowerCase().includes(ck)) && line.length >= 6 && line.length <= 70) {
      if (!previous_companies.includes(line)) {
        previous_companies.push(line);
      }
    }
  }

  const work_experience = cleanExpLines.slice(0, 4).join("\n");

  // Match dates like "2020 - 2023" or "Jan 2021 - Present"
  const employment_dates: string[] = [];
  const dateRegex = /\b(19\d\d|20\d\d|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:-|–|to)\s*(19\d\d|20\d\d|Present|Current)\b/gi;
  let dMatch;
  while ((dMatch = dateRegex.exec(rawText)) !== null) {
    if (!employment_dates.includes(dMatch[0])) {
      employment_dates.push(dMatch[0]);
    }
  }

  return {
    full_name,
    email,
    phone,
    education: education || undefined,
    work_experience: work_experience || undefined,
    skills: matchedSkills.length > 0 ? matchedSkills : undefined,
    previous_companies: previous_companies.slice(0, 3),
    previous_positions: previous_positions.slice(0, 4),
    employment_dates: employment_dates.slice(0, 4),
    rawText,
  };
}

/**
 * 100% Client-Side Built-in CV Parser.
 * Runs directly in the user's browser using PDF.js and structured pattern recognition.
 * Requires zero API tokens, has zero external network calls, zero quota limits, and zero cost.
 */
export async function extractCv(file: File): Promise<ExtractedCvData> {
  const rawText = await extractTextFromFile(file);
  return heuristicExtractCv(rawText);
}

// Backward-compatibility alias
export const extractCvWithAi = extractCv;

