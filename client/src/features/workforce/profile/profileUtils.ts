import { supabase } from "@/lib/supabase";
import { isPhoneSyntheticEmail, syntheticEmailToPhone } from "@/lib/phoneUtils";

export const fmtDateTime = (iso?: string | null): string =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export const calculateTenure = (joinDate?: string | null): number | null =>
  joinDate
    ? Math.floor((Date.now() - new Date(joinDate).getTime()) / (365.25 * 86400000))
    : null;

export const getUserInitials = (displayName?: string, email?: string): string => {
  const fallback = isPhoneSyntheticEmail(email) ? syntheticEmailToPhone(email) : email;
  return (displayName || fallback || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export async function syncEmployeeAndCandidate(
  employeeId: string,
  candidateId: string | null | undefined,
  payload: Record<string, any>
) {
  const { error } = await supabase.from("employees").update(payload).eq("id", employeeId);
  if (error) throw error;
  if (candidateId) {
    await supabase.from("candidates").update(payload).eq("id", candidateId);
  }
}
