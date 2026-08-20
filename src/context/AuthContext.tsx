import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, markSessionAlive } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: { display_name?: string; avatar_url?: string }) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  updatePassword: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
      // supabase-js doesn't push a refreshed session's JWT to the Realtime
      // socket on its own — without this, postgres_changes subscriptions
      // authenticate as `anon` and RLS silently drops every event.
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token);
        markSessionAlive();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      supabase.realtime.setAuth(session?.access_token ?? null);
      if (session) markSessionAlive();
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const logout = async () => {
    // GoTrue returns a "session_not_found" error on /logout once a session
    // has already been invalidated server-side (e.g. after the dead-session
    // recovery in supabase.ts already tried signing it out). supabase-js
    // only treats the plain 401/403/404 case as "already signed out, fine"
    // — this one slips through as AuthSessionMissingError instead, so
    // signOut() returns without ever clearing the local session, leaving
    // the user stuck looking logged in. Clear local state ourselves so
    // logout always succeeds from the app's point of view regardless of
    // what the server round trip reports.
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.VITE_APP_URL.replace(/\/$/, "")}/reset-password`,
    });
    if (error) throw error;
  };

  const updateProfile = async (updates: { display_name?: string; avatar_url?: string }) => {
    const { data, error } = await supabase.auth.updateUser({ data: updates });
    if (error) throw error;
    if (data.user) setUser(data.user);
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetPassword, updateProfile, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
