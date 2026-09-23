// Shared Rate Limiter for Supabase Edge Functions (Deno)

export interface RateLimitResult {
  allowed: boolean;
  currentCount: number;
  retryAfterSeconds: number;
}

export interface RateLimitOptions {
  keyPrefix: string;
  maxRequests: number;
  windowSeconds: number;
}

/**
 * Extracts the real client IP address from request headers.
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  return "unknown-ip";
}

/**
 * Executes atomic rate limit check via Supabase RPC `check_rate_limit`.
 */
export async function checkRateLimit(
  adminClient: any,
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const { data, error } = await adminClient.rpc("check_rate_limit", {
      p_key: key,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.warn(`[rate-limiter] RPC error for key "${key}":`, error.message);
      // Fail open on database error so legitimate users aren't locked out if DB transient error occurs
      return { allowed: true, currentCount: 1, retryAfterSeconds: 0 };
    }

    const row = Array.isArray(data) ? data[0] : data;
    return {
      allowed: row?.allowed ?? true,
      currentCount: row?.current_count ?? 1,
      retryAfterSeconds: row?.retry_after_seconds ?? 0,
    };
  } catch (err: any) {
    console.warn(`[rate-limiter] Exception for key "${key}":`, err?.message || err);
    return { allowed: true, currentCount: 1, retryAfterSeconds: 0 };
  }
}

/**
 * Returns a standard HTTP 429 Too Many Requests response.
 */
export function rateLimitResponse(
  retryAfterSeconds: number,
  message?: string,
  corsHeaders: Record<string, string> = {}
): Response {
  const waitMsg = retryAfterSeconds > 60 
    ? `${Math.ceil(retryAfterSeconds / 60)} minute(s)` 
    : `${retryAfterSeconds} second(s)`;

  return new Response(
    JSON.stringify({
      error: message || `Too many requests. Please wait ${waitMsg} before trying again.`,
      retry_after_seconds: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    }
  );
}
