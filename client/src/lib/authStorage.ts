import { isPhoneIdentifier, isPhoneSyntheticEmail, phoneToSyntheticEmail, normalizePhone, syntheticEmailToPhone } from "./phoneUtils";

const THIRTY_DAYS_DAYS = 30;
const THIRTY_DAYS_MS = THIRTY_DAYS_DAYS * 24 * 60 * 60 * 1000;

// OTP Trusted Device Window: Exactly 3 days for both email and phone number
const OTP_REMEMBER_DAYS = 3;
const OTP_REMEMBER_MS = OTP_REMEMBER_DAYS * 24 * 60 * 60 * 1000;

const LAST_ACTIVITY_KEY = "hrm_last_act_t";

// 1. Native Cookie Helpers
export function setCookie(name: string, value: string, days: number = THIRTY_DAYS_DAYS): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const nameEQ = encodeURIComponent(name) + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      } catch {
        return c.substring(nameEQ.length, c.length);
      }
    }
  }
  return null;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  const decoded = decodeURIComponent(name);
  const encoded = encodeURIComponent(decoded);
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${encoded}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
  document.cookie = `${decoded}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

// 2. Cookie + SessionStorage Adapter
export const authSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    const cookieVal = getCookie(key);
    if (cookieVal) return cookieVal;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    setCookie(key, value, THIRTY_DAYS_DAYS);
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // ignore storage quota errors
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    deleteCookie(key);
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

// 3. Normalized Phone & Email Identifier Helper
function normalizeAuthIdentifier(identifier: string): string {
  const raw = (identifier || "").trim().toLowerCase();
  if (isPhoneIdentifier(raw) || isPhoneSyntheticEmail(raw)) {
    const phone = isPhoneSyntheticEmail(raw) ? syntheticEmailToPhone(raw) : raw;
    const cleanDigits = normalizePhone(phone);
    return phoneToSyntheticEmail(cleanDigits);
  }
  return raw;
}

const DEVICE_KEY = (email: string) => `otp_dev_${normalizeAuthIdentifier(email)}`;

function clearDeviceKey(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
  deleteCookie(key);
  authSessionStorage.removeItem(key);
}

function getDeviceKeys(identifier: string): string[] {
  if (!identifier) return [];
  const raw = identifier.trim().toLowerCase();
  const canonicalKey = DEVICE_KEY(raw);
  const rawKey = `otp_dev_${raw}`;
  const keys = new Set<string>([canonicalKey, rawKey]);

  if (isPhoneIdentifier(raw) || isPhoneSyntheticEmail(raw)) {
    const phone = isPhoneSyntheticEmail(raw) ? syntheticEmailToPhone(raw) : raw;
    const cleanDigits = normalizePhone(phone);
    const stripped = cleanDigits.replace(/^0+/, "");
    keys.add(`otp_dev_${cleanDigits}`);
    keys.add(`otp_dev_${stripped}`);
    keys.add(`otp_dev_${phoneToSyntheticEmail(cleanDigits)}`);
    keys.add(`otp_dev_${phoneToSyntheticEmail(stripped)}`);
  }

  return Array.from(keys);
}

// 4. Remember Token Management:
// - Both email and phone number accounts: exactly 3 days of device trust from OTP verification.
// - In 3 days if users logout and login again by email or phone number, no OTP is needed.
// - Once 3 days have passed, logging in will require OTP again.
// - Tokens are persisted in localStorage & cookies so they survive user logout.
export function checkDeviceRemembered(email: string): boolean {
  if (!email) return false;
  const keysToCheck = getDeviceKeys(email);
  const now = Date.now();

  const checkKey = (key: string): boolean => {
    let val: string | null = null;
    try {
      val = localStorage.getItem(key);
    } catch {
      // ignore
    }
    if (!val) {
      val = authSessionStorage.getItem(key);
    }
    if (!val) return false;

    try {
      const data = JSON.parse(val);
      if (typeof data === "object") {
        // Determine verifiedAt timestamp:
        // 1. If explicitly stored, use it.
        // 2. If legacy token from before migration, compute verifiedAt from original duration.
        let verifiedAt: number = data.verifiedAt;
        if (!verifiedAt && typeof data.expiresAt === "number") {
          const legacyDuration = data.isPhone ? OTP_REMEMBER_MS : THIRTY_DAYS_MS;
          verifiedAt = data.expiresAt - legacyDuration;
        }

        if (verifiedAt) {
          const age = now - verifiedAt;
          // Valid if verified within the last 3 days
          if (age >= 0 && age <= OTP_REMEMBER_MS) {
            return true;
          }
          // Expired if older than 3 days
          clearDeviceKey(key);
          return false;
        }

        // Generic fallback for any token with expiresAt
        if (typeof data.expiresAt === "number") {
          if (now <= data.expiresAt) {
            return true;
          }
          clearDeviceKey(key);
          return false;
        }
      }
    } catch {
      // Invalidate legacy non-JSON tokens
      clearDeviceKey(key);
      return false;
    }
    clearDeviceKey(key);
    return false;
  };

  return keysToCheck.some((key) => checkKey(key));
}

export function setDeviceRemembered(email: string): void {
  if (!email) return;
  const raw = (email || "").trim().toLowerCase();
  const isPhone = isPhoneIdentifier(raw) || isPhoneSyntheticEmail(raw);
  const durationMs = OTP_REMEMBER_MS;
  const durationDays = OTP_REMEMBER_DAYS;
  const now = Date.now();

  const payload = JSON.stringify({
    remembered: true,
    isPhone,
    verifiedAt: now,
    expiresAt: now + durationMs,
  });

  const keys = getDeviceKeys(email);
  for (const key of keys) {
    try {
      localStorage.setItem(key, payload);
    } catch {
      // ignore
    }
    setCookie(key, payload, durationDays);
    authSessionStorage.setItem(key, payload);
  }
}

export function clearDeviceRemembered(email: string): void {
  if (!email) return;
  const keys = getDeviceKeys(email);
  for (const key of keys) {
    clearDeviceKey(key);
  }
}

// 5. 30-Day Activity Tracker (Auto-Logout on 30 Days of Inactivity)
export function recordUserActivity(): void {
  const now = Date.now().toString();
  authSessionStorage.setItem(LAST_ACTIVITY_KEY, now);
}

export function isSessionExpired30Days(): boolean {
  const lastActiveStr = authSessionStorage.getItem(LAST_ACTIVITY_KEY);
  if (!lastActiveStr) return false;
  const lastActive = parseInt(lastActiveStr, 10);
  if (isNaN(lastActive)) return false;
  return Date.now() - lastActive > THIRTY_DAYS_MS;
}

export function clearUserActivity(): void {
  authSessionStorage.removeItem(LAST_ACTIVITY_KEY);
}

// 6. Complete Session Wipe for Logout (Preserving trusted device OTP tokens for skip-OTP)
export function clearAllAuthSessionData(): void {
  clearUserActivity();
  if (typeof document !== "undefined") {
    // Clear session cookies, preserving trusted device tokens (otp_dev_)
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const rawName = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      const decodedName = decodeURIComponent(rawName);
      if (!rawName.startsWith("otp_dev_") && !decodedName.startsWith("otp_dev_")) {
        deleteCookie(rawName);
      }
    }
  }
  try {
    sessionStorage.clear();
  } catch (err) {
    void err;
  }
  try {
    // Clear Supabase session tokens (sb-...) and activity markers,
    // while keeping trusted device tokens (otp_dev_...) across logout
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("sb-") || k.startsWith("hrm_last_"))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    void err;
  }
}
