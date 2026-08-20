import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { isDeviceRemembered as checkDeviceRemembered, setDeviceRemembered, forgetDevice as clearDeviceRemembered } from "@/lib/otp";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ otpRequired: boolean }>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string, password: string, rememberDevice: boolean) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: { display_name?: string; avatar_url?: string }) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  isDeviceRemembered: (email: string) => boolean;
  forgetDevice: (email: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ otpRequired: false }),
  sendOTP: async () => {},
  verifyOTP: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  updatePassword: async () => {},
  isDeviceRemembered: () => false,
  forgetDevice: () => {},
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
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      supabase.realtime.setAuth(session?.access_token ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ otpRequired: boolean }> => {
    // If device is remembered, skip OTP
    if (checkDeviceRemembered(email)) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { otpRequired: false };
    }

    // Verify password, then sign out — OTP verification will re-sign in
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    // Password is valid, now require OTP — send before signOut so JWT is still valid
    console.log("[login] Password verified, sending OTP...");
    await sendOTP(email);
    console.log("[login] OTP sent, signing out...");
    await supabase.auth.signOut();
    return { otpRequired: true };
  };

  const sendOTP = useCallback(async (email: string) => {
    const { data, error } = await supabase.functions.invoke("send-otp", {
      body: { email },
    });
    if (error) {
      let detail = data?.error;
      if (!detail && error.context instanceof Response) {
        try {
          const body = await error.context.json();
          detail = body?.error;
        } catch { /* non-JSON */ }
      }
      const msg = detail || error.message || "Failed to send OTP";
      console.error("[sendOTP] Edge Function error:", msg, { data, status: error.context?.status });
      throw new Error(msg);
    }
    if (data?.error) {
      console.error("[sendOTP] Function returned error:", data.error);
      throw new Error(data.error);
    }
  }, []);

  const verifyOTP = useCallback(async (email: string, otp: string, password: string, rememberDevice: boolean) => {
    const { data, error } = await supabase.functions.invoke("verify-otp", {
      body: { email, otp },
    });
    if (error) {
      let detail = data?.error;
      if (!detail && error.context instanceof Response) {
        try {
          const body = await error.context.json();
          detail = body?.error;
        } catch { /* non-JSON */ }
      }
      throw new Error(detail || error.message || "Failed to verify OTP");
    }
    if (data?.error) throw new Error(data.error);

    // OTP verified — now sign in for real
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;

    // Set remember device if requested
    if (rememberDevice) {
      setDeviceRemembered(email);
    }
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
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

  const isDeviceRememberedFn = useCallback((email: string) => {
    return checkDeviceRemembered(email);
  }, []);

  const forgetDeviceFn = useCallback((email: string) => {
    clearDeviceRemembered(email);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      sendOTP,
      verifyOTP,
      logout,
      resetPassword,
      updateProfile,
      updatePassword,
      isDeviceRemembered: isDeviceRememberedFn,
      forgetDevice: forgetDeviceFn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
