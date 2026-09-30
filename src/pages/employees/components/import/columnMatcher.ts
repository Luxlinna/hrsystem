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

  for (const field of SYSTEM_FIELDS) {
    // 1. Exact match with field key or label
    let match = cleanedDetected.find(
      (d) => d.cleaned === cleanKey(field.key) || d.cleaned === cleanKey(field.label)
    );

    // 2. Alias match
    if (!match) {
      match = cleanedDetected.find((d) =>
        field.aliases.some((alias) => d.cleaned === cleanKey(alias) || d.cleaned.includes(cleanKey(alias)))
      );
    }

    if (match) {
      mapping[field.key] = match.original;
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
