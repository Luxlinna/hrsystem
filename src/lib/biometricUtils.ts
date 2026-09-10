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
