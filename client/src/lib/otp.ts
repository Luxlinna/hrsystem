const REMEMBER_PREFIX = "hr_otp_remember_";
const REMEMBER_DAYS = 30;

interface RememberToken {
  expiresAt: number;
}

export function isDeviceRemembered(email: string): boolean {
  try {
    const raw = localStorage.getItem(REMEMBER_PREFIX + email.toLowerCase());
    if (!raw) return false;
    const token: RememberToken = JSON.parse(raw);
    if (Date.now() > token.expiresAt) {
      localStorage.removeItem(REMEMBER_PREFIX + email.toLowerCase());
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function setDeviceRemembered(email: string): void {
  const expiresAt = Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(REMEMBER_PREFIX + email.toLowerCase(), JSON.stringify({ expiresAt }));
}

export function forgetDevice(email: string): void {
  localStorage.removeItem(REMEMBER_PREFIX + email.toLowerCase());
}
