import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { supabase } from "@/lib/supabase";

async function callFn(name: "webauthn-register" | "webauthn-authenticate", body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke(name, {
    body: { ...body, rpID: window.location.hostname, origin: window.location.origin },
  });
  if (error) {
    const message = (data as any)?.error || error.message || "Request failed.";
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function registerDeviceFingerprint(deviceLabel: string): Promise<void> {
  const { options } = await callFn("webauthn-register", { step: "options" });
  const response = await startRegistration(options);
  await callFn("webauthn-register", { step: "verify", response, deviceLabel });
}

export async function verifyDeviceFingerprint(): Promise<void> {
  const { options } = await callFn("webauthn-authenticate", { step: "options" });
  const response = await startAuthentication(options);
  await callFn("webauthn-authenticate", { step: "verify", response });
}

export async function hasRegisteredFingerprint(employeeId: string): Promise<boolean> {
  const { count } = await supabase
    .from("webauthn_credentials")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", employeeId);
  return !!count && count > 0;
}
