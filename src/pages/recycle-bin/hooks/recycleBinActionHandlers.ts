import { supabase } from "@/lib/supabase";
import { extractR2Key, deleteDocument, isCloudflareR2Url } from "@/lib/r2-storage";
import type { BinItem } from "../types";

export async function restoreSingleItem(item: BinItem): Promise<any> {
  let error: any = null;

  if (item.table === "user_role_assignments") {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/manage-user-role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            action: "restore_assignment",
            assignment_id: item.id,
          }),
        }
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error) throw new Error(result.error || "Failed to restore user");
    } catch {
      const { error: dbErr } = await supabase
        .from("user_role_assignments")
        .update({ deleted_at: null, deleted_by: null })
        .eq("id", item.id);
      error = dbErr;
    }
  } else if (item.table === "onboarding_requests") {
    const [{ error: dbErr }] = await Promise.all([
      supabase
        .from("onboarding_requests")
        .update({ deleted_at: null, deleted_by: null })
        .eq("id", item.id),
      supabase
        .from("onboarding_checklist_tasks")
        .update({ deleted_at: null, deleted_by: null })
        .eq("onboarding_request_id", item.id),
    ]);
    error = dbErr;
  } else if (item.table === "branches") {
    const { error: bErr } = await supabase
      .from("branches")
      .update({ deleted_at: null, deleted_by: null, status: "active" })
      .eq("id", item.id);

    if (!bErr) {
      const { data: emps } = await supabase
        .from("employees")
        .select("id, email")
        .eq("branch_id", item.id);

      if (emps && emps.length > 0) {
        const empIds = emps.map((e) => e.id);
        const empEmails = emps.map((e) => e.email?.toLowerCase()).filter(Boolean);

        await supabase
          .from("employees")
          .update({ deleted_at: null, deleted_by: null, status: "active" })
          .in("id", empIds);

        if (empEmails.length > 0) {
          await supabase
            .from("user_role_assignments")
            .update({ deleted_at: null, deleted_by: null })
            .in("email", empEmails);
        }
      }

      await supabase
        .from("work_locations")
        .update({ deleted_at: null })
        .eq("branch_id", item.id);
    }
    error = bErr;
  } else {
    const { error: dbErr } = await supabase
      .from(item.table)
      .update({ deleted_at: null, deleted_by: null })
      .eq("id", item.id);
    error = dbErr;
  }
  return error;
}

export async function deleteForeverSingleItem(item: BinItem): Promise<any> {
  let error: any = null;

  if (item.table === "user_role_assignments") {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/manage-user-role`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            action: "delete_user_forever",
            assignment_id: item.id,
          }),
        }
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok || result.error)
        throw new Error(result.error || "Failed to delete user permanently");
    } catch {
      const { error: dbErr } = await supabase
        .from("user_role_assignments")
        .delete()
        .eq("id", item.id);
      error = dbErr;
    }
  } else if (item.table === "onboarding_requests") {
    const [{ error: dbErr }] = await Promise.all([
      supabase
        .from("onboarding_checklist_tasks")
        .delete()
        .eq("onboarding_request_id", item.id),
      supabase
        .from("onboarding_documents")
        .delete()
        .eq("onboarding_request_id", item.id),
      supabase.from("onboarding_requests").delete().eq("id", item.id),
    ]);
    error = dbErr;
  } else {
    const { error: dbErr } = await supabase.from(item.table).delete().eq("id", item.id);
    error = dbErr;
    if (!error && item.table === "documents" && item.raw?.file_url) {
      if (isCloudflareR2Url(item.raw.file_url)) {
        const key = extractR2Key(item.raw.file_url);
        if (key) await deleteDocument(key).catch(() => {});
      } else if (item.raw.file_url.includes("/storage/v1/")) {
        const filePath = item.raw.file_url.split("/documents/")[1];
        if (filePath) await supabase.storage.from("documents").remove([filePath]);
      }
    }
  }
  return error;
}
