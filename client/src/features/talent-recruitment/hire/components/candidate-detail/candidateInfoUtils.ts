export interface FormattedCredential {
  id: string;
  title: string;
  organization?: string;
  dateRange?: string;
  description?: string;
  highlights?: string[];
}

/**
 * Parses raw or delimited education/experience text dynamically into structured credential items.
 * Extracts title, organization, dates, and bullet details from standard CV text formats.
 */
export function parseCredentialList(
  text?: string | null,
  type: "education" | "experience" = "education"
): FormattedCredential[] {
  if (!text) return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Parse general multi-line or delimited text
  const rawChunks = trimmed
    .split(/[\r\n•;\u2022]+/)
    .map((l) => l.replace(/^[-*•\s]+/, "").trim())
    .filter(
      (l) =>
        l.length > 2 &&
        !/^(contact|phone|email|address|tools|references|soft\s*skills|technical\s*skills)\b/i.test(l)
    );

  return rawChunks.map((line, idx) => {
    let dateRange: string | undefined;
    let cleanLine = line;

    // Look for parenthesized or trailing dates like (2020 - 2023) or 2021 - Present
    const parenMatch = cleanLine.match(
      /\(([^)]*(?:19\d\d|20\d\d|Present|Current)[^)]*)\)/i
    );
    if (parenMatch) {
      dateRange = parenMatch[1].trim();
      cleanLine = cleanLine.replace(parenMatch[0], "").trim();
    } else {
      const dateMatch = cleanLine.match(
        /\b((?:19\d\d|20\d\d|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(?:-|–|to)\s*(?:19\d\d|20\d\d|Present|Current))\b/i
      );
      if (dateMatch) {
        dateRange = dateMatch[1].trim();
        cleanLine = cleanLine.replace(dateMatch[0], "").trim();
      }
    }

    // Split title and organization by common separators: " - ", " at ", " @ ", " | ", ", "
    let title = cleanLine;
    let organization: string | undefined;
    let extraDetails: string | undefined;

    const separatorParts = cleanLine.split(/\s+(?:-|–|—|at|@|\|)\s+/);
    if (separatorParts.length >= 2) {
      title = separatorParts[0].trim();
      organization = separatorParts[1].trim();
      if (separatorParts.length > 2) {
        extraDetails = separatorParts.slice(2).join(" – ").trim();
      }
    } else {
      const commaParts = cleanLine.split(/,\s*/);
      if (commaParts.length >= 2 && commaParts[0].length < 50) {
        title = commaParts[0].trim();
        organization = commaParts[1].trim();
        if (commaParts.length > 2) {
          extraDetails = commaParts.slice(2).join(", ").trim();
        }
      }
    }

    const highlights: string[] = [];
    if (extraDetails) {
      highlights.push(extraDetails);
    }

    return {
      id: `${type}-${idx}`,
      title: title || cleanLine,
      organization,
      dateRange,
      highlights: highlights.length > 0 ? highlights : undefined,
    };
  });
}
