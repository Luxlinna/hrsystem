import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';

// A stale/expired access token (e.g. after the tab was offline past the
// refresh window) causes PostgREST to return 401 instead of Supabase-js
// proactively refreshing. Retry once with a freshly refreshed session
// before giving up and signing the user out.
let refreshPromise: ReturnType<typeof supabase.auth.refreshSession> | null = null;

const fetchWithAuthRetry: typeof fetch = async (input, init) => {
  const response = await fetch(input, init);
  if (response.status !== 401) return response;

  if (!refreshPromise) {
    refreshPromise = supabase.auth.refreshSession().finally(() => {
      refreshPromise = null;
    });
  }
  const { data, error } = await refreshPromise;

  if (error || !data.session) {
    await supabase.auth.signOut();
    return response;
  }

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  return fetch(input, { ...init, headers });
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch: fetchWithAuthRetry },
});