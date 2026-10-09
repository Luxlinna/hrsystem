export function formatDateDMY(dateStr?: string | null | Date): string {
  if (!dateStr) return "—";
  if (dateStr instanceof Date) {
    if (isNaN(dateStr.getTime())) return "—";
    const d = String(dateStr.getDate()).padStart(2, "0");
    const m = String(dateStr.getMonth() + 1).padStart(2, "0");
    return `${d}/${m}/${dateStr.getFullYear()}`;
  }
  const str = String(dateStr).trim();
  if (!str || str === "null" || str === "undefined") return "—";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str)) {
    const rawDate = str.split("T")[0].split(" ")[0];
    const parts = rawDate.split("-");
    if (parts.length === 3) {
      const y = parts[0];
      const m = parts[1].padStart(2, "0");
      const d = parts[2].padStart(2, "0");
      return `${d}/${m}/${y}`;
    }
  }
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, "0");
      const m = String(parsed.getMonth() + 1).padStart(2, "0");
      const y = parsed.getFullYear();
      return `${d}/${m}/${y}`;
    }
  } catch {
    // fallback
  }
  return str;
}

export function stripHtml(html?: string | null): string {
  if (!html) return "—";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "—";
}

export function formatMultilinePreview(html?: string | null): string {
  if (!html) return "—";
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const decoded = withBreaks
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"');

  const lines = decoded
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);

  return lines.join("\n") || "—";
}
