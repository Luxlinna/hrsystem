import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type Step = "password" | "otp";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef<(HTMLInputElement | null)[]>([]);
  const { login, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.otpRequired) {
        setStep("otp");
        setResendCooldown(30);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    // Auto-advance to next input
    if (value && index < 5) {
      otpInputRef.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (newOtp.every((d) => d !== "")) {
      handleOtpSubmit(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRef.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = useCallback(async (otpValue?: string) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      await verifyOTP(email, code, password, rememberDevice);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
      setOtp(["", "", "", "", "", ""]);
      otpInputRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [email, otp, password, rememberDevice, verifyOTP, navigate]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await sendOTP(email);
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      otpInputRef.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleBackToLogin = () => {
    setStep("password");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 border border-gray-100">
        <div className="text-center mb-8">
          <img src="/logo-mark.png" alt="HRM_OPS Logo" className="w-14 h-14 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">HRM_OPS</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            {step === "password" ? "Sign in to your account" : "Enter verification code"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-[12px] text-red-600">
            {error}
          </div>
        )}

        {step === "password" ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
                  placeholder="admin@hrmops.com"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[12px] font-semibold text-gray-700">Password</label>
                <Link to="/forgot-password" className="text-[12px] font-semibold text-[#253C7D] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <i className="ri-lock-line absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={showPassword ? "ri-eye-off-line text-base" : "ri-eye-line text-base"} />
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="ri-shield-check-line text-2xl text-[#253C7D]" />
              </div>
              <p className="text-[13px] text-gray-600">
                We sent a 6-digit code to
              </p>
              <p className="text-[13px] font-semibold text-gray-900">{email}</p>
            </div>

            <div className="flex justify-center gap-2.5">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpInputRef.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-[18px] font-semibold text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
                />
              ))}
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D]/20"
              />
              <span className="text-[12px] text-gray-600">Remember this device for 30 days</span>
            </label>

            <button
              onClick={() => handleOtpSubmit()}
              disabled={loading || otp.some((d) => !d)}
              className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>

            <div className="text-center space-y-2">
              <p className="text-[12px] text-gray-500">
                Didn't receive the code?{" "}
                {resendCooldown > 0 ? (
                  <span className="text-gray-400">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[#253C7D] font-semibold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </p>
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-[12px] text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="ri-arrow-left-line mr-1" />
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
