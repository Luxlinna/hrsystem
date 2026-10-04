const PIN_STORAGE_PREFIX = "hrms_privacy_pin_";

export function getPrivacyPin(userEmail?: string | null): string | null {
  if (typeof window === "undefined") return null;
  const key = `${PIN_STORAGE_PREFIX}${userEmail || "global"}`;
  const val = localStorage.getItem(key);
  if (val) return val;
  // Fallback to global if specific email not set
  return localStorage.getItem(`${PIN_STORAGE_PREFIX}global`);
}

export function isPrivacyPinEnabled(userEmail?: string | null): boolean {
  return Boolean(getPrivacyPin(userEmail));
}

export function setPrivacyPin(pin: string, userEmail?: string | null): void {
  if (typeof window === "undefined") return;
  const key = `${PIN_STORAGE_PREFIX}${userEmail || "global"}`;
  localStorage.setItem(key, pin);
}

export function removePrivacyPin(userEmail?: string | null): void {
  if (typeof window === "undefined") return;
  const key = `${PIN_STORAGE_PREFIX}${userEmail || "global"}`;
  localStorage.removeItem(key);
}

export function verifyPrivacyPin(inputPin: string, userEmail?: string | null): boolean {
  const currentPin = getPrivacyPin(userEmail);
  if (!currentPin) return true; // If no PIN is configured, allow
  return currentPin === inputPin.trim();
}
