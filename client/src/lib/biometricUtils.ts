/**
 * Utilities for formatting and parsing Biometric Machine IDs and BU User IDs.
 *
 * Each BU (Business Unit / Branch) has its own sequential numbering:
 * e.g., "Pinex Agro 001" through "Pinex Agro 090" or higher.
 */

/**
 * Returns a 3-digit padded number string (e.g. 1 -> "001", 24 -> "024", 105 -> "105").
 */
export function formatPaddedPin(rawId?: string | number | null): string {
  if (rawId === undefined || rawId === null) return "";
  const str = String(rawId).trim();
  if (!str) return "";

  const match = str.match(/\d+/);
  if (!match) return str;

  const num = parseInt(match[0], 10);
  if (isNaN(num)) return str;

  return num < 1000 ? String(num).padStart(3, "0") : String(num);
}

/**
 * Extracts clean numeric PIN for ZKTeco machine firmware:
 * e.g. "Pinex Agro 001" -> "1"
 * e.g. "024" -> "24"
 */
export function extractMachinePin(rawId?: string | number | null): string {
  if (rawId === undefined || rawId === null) return "";
  const match = String(rawId).match(/\d+/);
  if (!match) return String(rawId).trim();
  const num = parseInt(match[0], 10);
  return isNaN(num) ? String(rawId).trim() : String(num);
}

/**
 * Formats an employee's BU Biometric ID to the full standard format:
 * e.g. "Pinex Agro 001", "Pinex Agro 090", "OPS sulotion 005", etc.
 */
export function formatBiometricId(rawId?: string | null, branchName?: string | null): string {
  if (!rawId) return "";
  const trimmed = String(rawId).trim();
  if (!trimmed) return "";

  const paddedPin = formatPaddedPin(trimmed);
  const bu = branchName?.trim() || "";

  if (!bu) {
    return paddedPin;
  }

  // If rawId already contains the BU name, normalize to single BU + 3-digit padded PIN
  if (trimmed.toLowerCase().startsWith(bu.toLowerCase())) {
    return `${bu} ${paddedPin}`;
  }

  return `${bu} ${paddedPin}`;
}

/**
 * Natural comparison for sorting BU Biometric IDs:
 * "001" comes before "002", "010", "100".
 * Numeric IDs are compared numerically; non-numeric values compared alphabetically;
 * Employees without an ID are consistently sorted to the end.
 */
export function compareBiometricIds(
  aId?: string | number | null,
  bId?: string | number | null
): number {
  const aStr = aId !== undefined && aId !== null ? String(aId).trim() : "";
  const bStr = bId !== undefined && bId !== null ? String(bId).trim() : "";

  if (!aStr && !bStr) return 0;
  if (!aStr) return 1;
  if (!bStr) return -1;

  const aMatch = aStr.match(/\d+/);
  const bMatch = bStr.match(/\d+/);

  const aNum = aMatch ? parseInt(aMatch[0], 10) : NaN;
  const bNum = bMatch ? parseInt(bMatch[0], 10) : NaN;

  if (!isNaN(aNum) && !isNaN(bNum)) {
    if (aNum !== bNum) return aNum - bNum;
  } else if (!isNaN(aNum)) {
    return -1;
  } else if (!isNaN(bNum)) {
    return 1;
  }

  return aStr.localeCompare(bStr, undefined, { numeric: true, sensitivity: "base" });
}
