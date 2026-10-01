import { createClient } from '@supabase/supabase-js';
import { authSessionStorage } from './authStorage';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';

// Multi-tab safe token refresh and retry handler.
// Instead of aggressively calling signOut() on any 401 (which kills active sessions
// across other tabs and causes concurrent tab crashes), we attempt to sync with
// the latest session or refresh once, then return the response without destroying the session.
let refreshPromise: ReturnType<typeof supabase.auth.refreshSession> | null = null;

export function markSessionAlive() {
  // Kept for backward compatibility
}

const fetchWithAuthRetry: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (response.status !== 401) return response;

  try {
    // 1. Check if another tab has already refreshed the session in session/cookie storage
    const { data: currentSessionData } = await supabase.auth.getSession();
    const currentToken = currentSessionData?.session?.access_token;

    // Check previous header token
    const oldHeader = init?.headers ? new Headers(init.headers).get('Authorization') : null;
    const oldToken = oldHeader ? oldHeader.replace(/^Bearer\s+/i, '') : null;

    if (currentToken && currentToken !== oldToken) {
      // Another tab already got a newer token, retry immediately with it
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${currentToken}`);
      return fetch(input, { ...init, headers });
    }

    // 2. If token hasn't changed, attempt a single deduplicated refresh
    if (!refreshPromise) {
      refreshPromise = supabase.auth.refreshSession().finally(() => {
        refreshPromise = null;
      });
    }
    const { data: refreshedData, error: refreshError } = await refreshPromise;

    if (!refreshError && refreshedData?.session?.access_token) {
      const headers = new Headers(init?.headers);
      headers.set('Authorization', `Bearer ${refreshedData.session.access_token}`);
      return fetch(input, { ...init, headers });
    }
  } catch {
    // Network or parse issue — do not log out, just return original 401 response
  }

  return response;
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authSessionStorage,
  },
  global: { fetch: fetchWithAuthRetry },
});