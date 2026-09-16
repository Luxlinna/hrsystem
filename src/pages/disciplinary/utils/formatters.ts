export function formatDateDMY(dateStr?: string | null): string {
  if (!dateStr) return "—";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const parts = dateStr.split("T")[0].split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
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
