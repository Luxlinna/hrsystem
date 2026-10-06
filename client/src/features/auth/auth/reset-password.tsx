import { useResetPassword } from "./hooks/useResetPassword";
import { ExpiredInvitePanel } from "./components/ExpiredInvitePanel";
import { NewPasswordForm } from "./components/NewPasswordForm";

export default function ResetPasswordPage() {
  const {
    password,
    setPassword,
    confirm,
    setConfirm,
    error,
    loading,
    checking,
    hasSession,
    invitedEmail,
    handleSubmit,
  } = useResetPassword();

  const searchParams = new URLSearchParams(window.location.search);
  const isInvite = searchParams.get("mode") === "invite" || !window.location.search.includes("type=recovery");

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0] p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 border border-gray-100 shadow-xs">
        <div className="text-center mb-8">
          <img src="/logo-mark.png" alt="HRM_OPS Logo" className="w-20 h-20 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">
            {isInvite ? "Set Up Your Account" : "Set New Password"}
          </h1>
          <p className="text-[13px] text-gray-500 mt-1">
            {isInvite
              ? "Create a password to activate your account"
              : "Create a new password to access your account"}
          </p>
        </div>

        {checking ? (
          <div className="flex flex-col items-center py-8 text-gray-400">
            <span className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] mt-3">Verifying your reset authorization...</p>
          </div>
        ) : !hasSession ? (
          <ExpiredInvitePanel />
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-[12px] text-red-600">
                {error}
              </div>
            )}

            <NewPasswordForm
              invitedEmail={invitedEmail}
              password={password}
              setPassword={setPassword}
              confirm={confirm}
              setConfirm={setConfirm}
              loading={loading}
              onSubmit={handleSubmit}
            />
          </>
        )}
      </div>
    </div>
  );
}
