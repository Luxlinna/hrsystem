import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  getLockoutStatus,
  recordFailedLogin,
  recordSuccessfulLogin,
  formatLockoutTimer,
} from "../loginRateLimiter";

export type LoginStep = "password" | "otp";

export function useLogin() {
  const [step, setStep] = useState<LoginStep>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [telegramBotUrl, setTelegramBotUrl] = useState<string | null>(null);

  // Lockout / Rate Limiting State
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [singleAttemptAllowed, setSingleAttemptAllowed] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);

  const otpInputRef = useRef<(HTMLInputElement | null)[]>([]);
  const { user, loading: authLoading, login, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  // Redirect to self-service if already logged in (e.g. multi-tab)
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/self-service", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Synchronize lockout status whenever email or phone number input changes
  useEffect(() => {
    if (!email.trim()) {
      setIsLocked(false);
      setLockoutSeconds(0);
      setSingleAttemptAllowed(false);
      setAttemptsRemaining(5);
      return;
    }
    const status = getLockoutStatus(email);
    setIsLocked(status.isLocked);
    setLockoutSeconds(status.remainingSeconds);
    setSingleAttemptAllowed(status.singleAttemptAllowed);
    setAttemptsRemaining(status.attemptsRemaining);
  }, [email]);

  // Active countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsLocked(false);
          setSingleAttemptAllowed(true);
          setAttemptsRemaining(1);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus OTP input when step changes
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpInputRef.current[0]?.focus(), 100);
    }
  }, [step]);

  const handlePasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !password) return;

    // Check if account is currently locked out
    const currentStatus = getLockoutStatus(email);
    if (currentStatus.isLocked) {
      setIsLocked(true);
      setLockoutSeconds(currentStatus.remainingSeconds);
      setError(
        `Too many failed login attempts. Please wait ${formatLockoutTimer(currentStatus.remainingSeconds)} before trying again.`
      );
      return;
    }

    setError("");
    setLoading(true);
    try {
      setTelegramBotUrl(null);
      const result = await login(email, password);

      // On successful credentials: clear lockout record completely
      recordSuccessfulLogin(email);
      setIsLocked(false);
      setLockoutSeconds(0);
      setSingleAttemptAllowed(false);
      setAttemptsRemaining(5);

      if (result.otpRequired) {
        setStep("otp");
        setResendCooldown(30);
      } else {
        navigate("/self-service");
      }
    } catch (err: any) {
      if (err.telegramNotConnected || err.botUrl || err.message?.includes("Telegram is not connected")) {
        setTelegramBotUrl(err.botUrl || "https://t.me/HRM_OPS_bot?start=connect");
        setError("");
      } else {
        const isCredError =
          err?.status === 401 ||
          err?.statusCode === 401 ||
          err?.status === 429 ||
          err?.statusCode === 429 ||
          err?.message?.toLowerCase().includes("invalid") ||
          err?.message?.toLowerCase().includes("password") ||
          err?.message?.toLowerCase().includes("credential") ||
          err?.message?.toLowerCase().includes("too many");

        if (isCredError) {
          const retrySec = err.retryAfterSeconds;
          const stage = err.stage;
          const outcome = recordFailedLogin(email, retrySec, stage);
          setIsLocked(outcome.isLocked);
          setLockoutSeconds(outcome.remainingSeconds);
          setSingleAttemptAllowed(outcome.stage >= 1 && !outcome.isLocked);
          setAttemptsRemaining(outcome.attemptsRemaining);
          setError(outcome.message);
        } else {
          setError(err.message || "Invalid email, phone number, or password");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = useCallback(async (otpValue?: string) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      await verifyOTP(email, code, password, rememberDevice);
      navigate("/self-service");
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
      setOtp(["", "", "", "", "", ""]);
      otpInputRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [email, otp, password, rememberDevice, verifyOTP, navigate]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      otpInputRef.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      handleOtpSubmit(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRef.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await sendOTP(email);
      setTelegramBotUrl(null);
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      otpInputRef.current[0]?.focus();
    } catch (err: any) {
      if (err.telegramNotConnected || err.botUrl) {
        setTelegramBotUrl(err.botUrl || "https://t.me/HRM_OPS_bot?start=connect");
      } else {
        setError(err.message || "Failed to resend code");
      }
    }
  };

  const handleBackToLogin = () => {
    setStep("password");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setPassword("");
    setTelegramBotUrl(null);
  };

  return {
    step,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    otp,
    error,
    loading,
    rememberDevice,
    setRememberDevice,
    resendCooldown,
    telegramBotUrl,
    setTelegramBotUrl,
    otpInputRef,
    isLocked,
    lockoutSeconds,
    singleAttemptAllowed,
    attemptsRemaining,
    handlePasswordSubmit,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpSubmit,
    handleResend,
    handleBackToLogin,
  };
}
