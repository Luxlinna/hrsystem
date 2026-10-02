import { isPhoneIdentifier, isPhoneSyntheticEmail, phoneToSyntheticEmail, normalizePhone, syntheticEmailToPhone } from "./phoneUtils";

const THIRTY_DAYS_DAYS = 30;
const THIRTY_DAYS_MS = THIRTY_DAYS_DAYS * 24 * 60 * 60 * 1000;

const THREE_DAYS_DAYS = 3;
const THREE_DAYS_MS = THREE_DAYS_DAYS * 24 * 60 * 60 * 1000;

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
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
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

// 4. Remember Token Management:
// - Phone number accounts: 3 days of login inactivity (sliding window refreshed on every login).
// - Email accounts: 30 days device trust.
// - Tokens are persisted in localStorage & cookies so they survive user logout.
export function checkDeviceRemembered(email: string): boolean {
  if (!email) return false;
  const canonicalKey = DEVICE_KEY(email);
  const rawKey = `otp_dev_${email.trim().toLowerCase()}`;

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
      if (typeof data === "object" && data?.expiresAt) {
        if (Date.now() > data.expiresAt) {
          clearDeviceKey(key);
          return false;
        }
        return true;
      }
    } catch {
      if (val === "true") return true;
    }
    return false;
  };

  return checkKey(canonicalKey) || checkKey(rawKey);
}

export function setDeviceRemembered(email: string): void {
  if (!email) return;
  const raw = (email || "").trim().toLowerCase();
  const isPhone = isPhoneIdentifier(raw) || isPhoneSyntheticEmail(raw);
  const durationMs = isPhone ? THREE_DAYS_MS : THIRTY_DAYS_MS;
  const durationDays = isPhone ? THREE_DAYS_DAYS : THIRTY_DAYS_DAYS;

  const canonicalKey = DEVICE_KEY(email);
  const rawKey = `otp_dev_${raw}`;
  const payload = JSON.stringify({
    remembered: true,
    isPhone,
    expiresAt: Date.now() + durationMs,
  });

  try {
    localStorage.setItem(canonicalKey, payload);
    localStorage.setItem(rawKey, payload);
  } catch {
    // ignore
  }
  setCookie(canonicalKey, payload, durationDays);
  setCookie(rawKey, payload, durationDays);
  authSessionStorage.setItem(canonicalKey, payload);
  authSessionStorage.setItem(rawKey, payload);
}

export function clearDeviceRemembered(email: string): void {
  if (!email) return;
  const canonicalKey = DEVICE_KEY(email);
  const rawKey = `otp_dev_${email.trim().toLowerCase()}`;
  clearDeviceKey(canonicalKey);
  clearDeviceKey(rawKey);
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
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (!name.startsWith("otp_dev_")) {
        deleteCookie(name);
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
