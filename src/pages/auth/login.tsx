import { useLogin } from "./hooks/useLogin";
import { PasswordLoginForm } from "./components/PasswordLoginForm";
import { OtpVerificationForm } from "./components/OtpVerificationForm";

export default function LoginPage() {
  const {
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
    otpInputRef,
    handlePasswordSubmit,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpSubmit,
    handleResend,
    handleBackToLogin,
  } = useLogin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 border border-gray-100 shadow-xs">
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
          <PasswordLoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            onSubmit={handlePasswordSubmit}
          />
        ) : (
          <OtpVerificationForm
            email={email}
            otp={otp}
            otpInputRef={otpInputRef}
            loading={loading}
            rememberDevice={rememberDevice}
            setRememberDevice={setRememberDevice}
            resendCooldown={resendCooldown}
            onOtpChange={handleOtpChange}
            onOtpKeyDown={handleOtpKeyDown}
            onSubmit={handleOtpSubmit}
            onResend={handleResend}
            onBackToLogin={handleBackToLogin}
          />
        )}
      </div>
    </div>
  );
}
