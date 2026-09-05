/**
 * Phone utilities for normalization, synthetic email mapping for Supabase Auth,
 * and clean display across the application.
 */

export const PHONE_EMAIL_DOMAIN = "@phone.hrmsystem.local";

/**
 * Normalizes phone numbers by stripping all formatting characters.
 * Handles Cambodian format variations (converting leading 855 -> 0).
 */
export function normalizePhone(phone: string): string {
  let digits = (phone || "").replace(/\D/g, "");
  // If starts with 855 and has country code prefix, convert to Cambodian national 0...
  if (digits.startsWith("855") && digits.length >= 11) {
    digits = "0" + digits.slice(3);
  }
  return digits;
}

/**
 * Checks if an input string is a phone number rather than an email address.
 */
export function isPhoneIdentifier(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim();
  if (trimmed.includes("@")) return false;
  // Contains at least 6 digits and only valid phone characters (+, digits, spaces, dashes, parentheses)
  const digitsOnly = trimmed.replace(/\D/g, "");
  return digitsOnly.length >= 6 && /^[\d\s+\-().]+$/.test(trimmed);
}

/**
 * Converts a phone number to an internal canonical synthetic email for Supabase Auth.
 */
export function phoneToSyntheticEmail(phone: string): string {
  const clean = normalizePhone(phone);
  return `${clean}${PHONE_EMAIL_DOMAIN}`;
}

/**
 * Checks whether an email string is an internal phone-based synthetic email.
 */
export function isPhoneSyntheticEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(PHONE_EMAIL_DOMAIN);
}

/**
 * Extracts the clean phone number from a synthetic email, or returns the original string.
 */
export function syntheticEmailToPhone(email?: string | null): string {
  if (!email || !isPhoneSyntheticEmail(email)) return email || "";
  return email.slice(0, -PHONE_EMAIL_DOMAIN.length);
}

/**
 * Returns the best user-facing contact string to display for an employee.
 * If email is a synthetic phone email or empty, returns their phone number.
 */
export function getDisplayContact(email?: string | null, phone?: string | null): string {
  if (email && !isPhoneSyntheticEmail(email)) {
    return email;
  }
  if (phone) {
    return phone;
  }
  if (email && isPhoneSyntheticEmail(email)) {
    return syntheticEmailToPhone(email);
  }
  return "—";
}
