import { resolveAuthEmail } from "@/context/authOtpService";

export interface LockoutRecord {
  failedAttempts: number;
  stage: number; // 0 = initial (up to 5 attempts), 1 = 1-min lock, 2 = 5-min lock (1x5), 3 = 25-min lock (5x5)...
  lockoutUntil: number; // Timestamp in ms
  lastAttemptAt: number;
}

export interface LockoutStatus {
  isLocked: boolean;
  remainingSeconds: number;
  stage: number;
  attemptsRemaining: number;
  singleAttemptAllowed: boolean;
}

const STORAGE_PREFIX = "hrm_login_lockout_";

/**
 * Returns canonical key for an email or phone number.
 * Formatted phone, raw phone, and synthetic phone emails all map to the same key.
 */
export function getCanonicalLoginKey(identifier: string): string {
  if (!identifier) return "";
  return resolveAuthEmail(identifier.trim()).toLowerCase();
}

/**
 * Reads the lockout record for an identifier from localStorage.
 */
export function getLockoutRecord(identifier: string): LockoutRecord {
  const key = getCanonicalLoginKey(identifier);
  if (!key || typeof window === "undefined") {
    return { failedAttempts: 0, stage: 0, lockoutUntil: 0, lastAttemptAt: 0 };
  }

  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw) {
      const parsed = JSON.parse(raw) as LockoutRecord;
      if (typeof parsed.failedAttempts === "number" && typeof parsed.lockoutUntil === "number") {
        return parsed;
      }
    }
  } catch {
    // Ignore JSON parse errors
  }

  return { failedAttempts: 0, stage: 0, lockoutUntil: 0, lastAttemptAt: 0 };
}

/**
 * Saves the lockout record to localStorage.
 */
function saveLockoutRecord(identifier: string, record: LockoutRecord): void {
  const key = getCanonicalLoginKey(identifier);
  if (!key || typeof window === "undefined") return;

  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(record));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Checks current lockout status for an identifier.
 */
export function getLockoutStatus(identifier: string): LockoutStatus {
  const record = getLockoutRecord(identifier);
  const now = Date.now();

  if (record.lockoutUntil > now) {
    const remainingSeconds = Math.max(1, Math.ceil((record.lockoutUntil - now) / 1000));
    return {
      isLocked: true,
      remainingSeconds,
      stage: record.stage,
      attemptsRemaining: 0,
      singleAttemptAllowed: false,
    };
  }

  // If lockout duration has elapsed
  if (record.stage >= 1) {
    // Lockout expired: User is allowed exactly 1 attempt
    return {
      isLocked: false,
      remainingSeconds: 0,
      stage: record.stage,
      attemptsRemaining: 1,
      singleAttemptAllowed: true,
    };
  }

  // Initial stage: up to 5 attempts
  const remaining = Math.max(0, 5 - record.failedAttempts);
  return {
    isLocked: false,
    remainingSeconds: 0,
    stage: 0,
    attemptsRemaining: remaining,
    singleAttemptAllowed: false,
  };
}

/**
 * Records a failed password attempt:
 * - Stage 0: 1 to 4 fails (shows remaining), 5th fail locks out for 1 minute (60s).
 * - Stage 1 (after 1-min wait, allowed 1 try): if fails, locks out for 5 minutes (300s, "1x5").
 * - Stage 2 (after 5-min wait, allowed 1 try): if fails, locks out for 25 minutes (1500s, "5x5").
 * - Stage 3+: continues 25-minute lockout (1 try after waiting).
 */
export function recordFailedLogin(
  identifier: string,
  serverRetrySeconds?: number,
  serverStage?: number
): {
  isLocked: boolean;
  remainingSeconds: number;
  stage: number;
  attemptsRemaining: number;
  message: string;
} {
  const key = getCanonicalLoginKey(identifier);
  if (!key) {
    return {
      isLocked: false,
      remainingSeconds: 0,
      stage: 0,
      attemptsRemaining: 5,
      message: "Invalid credentials.",
    };
  }

  const record = getLockoutRecord(identifier);
  const now = Date.now();

  record.failedAttempts += 1;
  record.lastAttemptAt = now;

  // If server explicitly returned a retryAfterSeconds (429 response)
  if (serverRetrySeconds && serverRetrySeconds > 0) {
    record.stage = serverStage || Math.max(1, record.stage + 1);
    record.lockoutUntil = now + serverRetrySeconds * 1000;
    saveLockoutRecord(identifier, record);
    return {
      isLocked: true,
      remainingSeconds: serverRetrySeconds,
      stage: record.stage,
      attemptsRemaining: 0,
      message: `Too many failed login attempts. Please wait ${formatLockoutTimer(serverRetrySeconds)} before trying again.`,
    };
  }

  if (record.stage === 0) {
    if (record.failedAttempts >= 5) {
      // Stage 1: 1 minute (60 seconds)
      record.stage = 1;
      const durationSec = 60;
      record.lockoutUntil = now + durationSec * 1000;
      saveLockoutRecord(identifier, record);

      return {
        isLocked: true,
        remainingSeconds: durationSec,
        stage: 1,
        attemptsRemaining: 0,
        message: "Too many failed login attempts. Please wait 1 minute before trying again.",
      };
    } else {
      const remaining = 5 - record.failedAttempts;
      saveLockoutRecord(identifier, record);

      return {
        isLocked: false,
        remainingSeconds: 0,
        stage: 0,
        attemptsRemaining: remaining,
        message: `Invalid password. You have ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining before temporary lockout.`,
      };
    }
  } else {
    // User already waited out a previous lockout and failed their 1 allowed attempt!
    let durationSec = 60;
    const nextStage = record.stage + 1;

    if (record.stage === 1) {
      // "1x5" = 1 * 5 = 5 minutes (300 seconds)
      durationSec = 5 * 60;
    } else if (record.stage === 2) {
      // "5x5" = 5 * 5 = 25 minutes (1500 seconds)
      durationSec = 25 * 60;
    } else {
      // Stage 3+: 25 minutes
      durationSec = 25 * 60;
    }

    record.stage = nextStage;
    record.lockoutUntil = now + durationSec * 1000;
    saveLockoutRecord(identifier, record);

    const minutes = Math.round(durationSec / 60);
    return {
      isLocked: true,
      remainingSeconds: durationSec,
      stage: record.stage,
      attemptsRemaining: 0,
      message: `Too many failed login attempts. Please wait ${minutes} minutes before trying again.`,
    };
  }
}

/**
 * Resets lockout on successful login.
 */
export function recordSuccessfulLogin(identifier: string): void {
  const key = getCanonicalLoginKey(identifier);
  if (!key || typeof window === "undefined") return;

  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // Ignore
  }
}

/**
 * Formats seconds into MM:SS format (e.g. 00:59, 04:30, 24:15).
 */
export function formatLockoutTimer(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(sec / 60);
  const remainingSecs = sec % 60;
  return `${String(mins).padStart(2, "0")}:${String(remainingSecs).padStart(2, "0")}`;
}
