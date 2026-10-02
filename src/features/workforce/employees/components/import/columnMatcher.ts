import { cleanKey } from "./fieldNormalizer";
import { SYSTEM_FIELDS, type ColumnMappingState } from "./types";

export function detectColumnMappings(
  detectedHeaders: string[]
): ColumnMappingState {
  const mapping: ColumnMappingState = {};
  const cleanedDetected = detectedHeaders.map((h) => ({
    original: h,
    cleaned: cleanKey(h),
  }));

  const claimedHeaders = new Set<string>();

  // Pass 1: Exact match on field key, label, or exact alias
  for (const field of SYSTEM_FIELDS) {
    const fieldCleanedKey = cleanKey(field.key);
    const fieldCleanedLabel = cleanKey(field.label);
    const cleanedAliases = (field.aliases || []).map(cleanKey);

    const match = cleanedDetected.find(
      (d) =>
        !claimedHeaders.has(d.original) &&
        (d.cleaned === fieldCleanedKey ||
          d.cleaned === fieldCleanedLabel ||
          cleanedAliases.includes(d.cleaned))
    );

    if (match) {
      mapping[field.key] = match.original;
      claimedHeaders.add(match.original);
    }
  }

  // Pass 2: Exact containment match for long distinctive terms (min length 4)
  for (const field of SYSTEM_FIELDS) {
    if (mapping[field.key]) continue;

    const cleanedAliases = (field.aliases || []).map(cleanKey);
    const match = cleanedDetected.find((d) => {
      if (claimedHeaders.has(d.original)) return false;
      if (d.cleaned.length < 4) return false;
      return cleanedAliases.some((alias) => {
        if (alias.length < 4) return false;
        return d.cleaned.includes(alias) || alias.includes(d.cleaned);
      });
    });

    if (match) {
      mapping[field.key] = match.original;
      claimedHeaders.add(match.original);
    } else {
      mapping[field.key] = "";
    }
  }

  return mapping;
}

export function extractColumnSampleValues(
  rawRows: Record<string, any>[],
  detectedHeaders: string[]
): Record<string, string> {
  const samples: Record<string, string> = {};
  for (const header of detectedHeaders) {
    for (const row of rawRows) {
      const val = row[header];
      if (val != null && String(val).trim() !== "" && String(val).trim() !== "—") {
        samples[header] = String(val).trim();
        break;
      }
    }
    if (!samples[header]) samples[header] = "—";
  }
  return samples;
}
