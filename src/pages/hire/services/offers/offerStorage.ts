import { supabase } from "@/lib/supabase";
import type { OfferLetter } from "../../types";

const LOCAL_STORAGE_KEY = "hrm_offer_letters_store";

export function getLocalOffers(): OfferLetter[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setLocalOffers(offers: OfferLetter[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(offers));
  } catch {
    // Ignore quota errors
  }
}

export async function fetchOfferLetters(): Promise<OfferLetter[]> {
  try {
    const { data, error } = await supabase
      .from("offer_letters")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      // Sync local cache with remote
      const local = getLocalOffers();
      const combinedMap = new Map<string, OfferLetter>();
      local.forEach((o) => combinedMap.set(o.id, o));
      data.forEach((o) => combinedMap.set(o.id, o as OfferLetter));
      const merged = Array.from(combinedMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setLocalOffers(merged);

      // Auto-sync any local-only offers up to Supabase remote
      local.forEach(async (localOffer) => {
        if (!data.some((d) => d.id === localOffer.id)) {
          try {
            await supabase.from("offer_letters").upsert(localOffer, { onConflict: "id" });
          } catch {
            // Ignore
          }
        }
      });

      return merged.filter((o) => !o.deleted_at);
    }
  } catch {
    // Fallback to local storage
  }
  return getLocalOffers().filter((o) => !o.deleted_at);
}

export async function fetchCandidateOffer(candidateId: string): Promise<OfferLetter | null> {
  const offers = await fetchOfferLetters();
  return offers.find((o) => (o.candidate_id === candidateId || o.id === candidateId) && !o.deleted_at) || null;
}

export async function saveOfferLetter(offer: OfferLetter): Promise<OfferLetter> {
  const now = new Date().toISOString();
  const updatedOffer = { ...offer, updated_at: now };

  // Always update local cache immediately for responsive UI
  const current = getLocalOffers();
  const index = current.findIndex((o) => o.id === updatedOffer.id);
  if (index >= 0) {
    current[index] = updatedOffer;
  } else {
    current.unshift(updatedOffer);
  }
  setLocalOffers(current);

  // Try saving to Supabase
  try {
    const { error } = await supabase
      .from("offer_letters")
      .upsert(updatedOffer, { onConflict: "id" });

    if (error) {
      console.warn("Could not sync offer letter to Supabase remote, saved to local cache:", error.message);
    }
  } catch (err) {
    console.warn("Supabase upsert failed, stored in local storage cache:", err);
  }

  return updatedOffer;
}

export async function softDeleteOfferLetter(offerId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const current = getLocalOffers();
  const index = current.findIndex((o) => o.id === offerId);
  if (index >= 0) {
    current[index] = { ...current[index], deleted_at: now };
    setLocalOffers(current);
  }

  try {
    const { error } = await supabase
      .from("offer_letters")
      .update({ deleted_at: now })
      .eq("id", offerId);
    if (error) {
      console.warn("Could not soft delete from Supabase, updated local cache:", error.message);
    }
  } catch (err) {
    console.warn("Failed to soft delete from Supabase:", err);
  }

  return true;
}

export async function restoreOfferLetter(offerId: string): Promise<boolean> {
  const current = getLocalOffers();
  const index = current.findIndex((o) => o.id === offerId);
  if (index >= 0) {
    current[index] = { ...current[index], deleted_at: undefined };
    setLocalOffers(current);
  }

  try {
    const { error } = await supabase
      .from("offer_letters")
      .update({ deleted_at: null })
      .eq("id", offerId);
    if (error) {
      console.warn("Could not restore in Supabase, updated local cache:", error.message);
    }
  } catch (err) {
    console.warn("Failed to restore in Supabase:", err);
  }

  return true;
}

export const deleteOfferLetter = softDeleteOfferLetter;

export async function deleteForeverOfferLetter(offerId: string): Promise<boolean> {
  const current = getLocalOffers();
  const updated = current.filter((o) => o.id !== offerId);
  setLocalOffers(updated);

  try {
    const { error } = await supabase
      .from("offer_letters")
      .delete()
      .eq("id", offerId);
    if (error) {
      console.warn("Could not delete forever from Supabase, updated local cache:", error.message);
    }
  } catch (err) {
    console.warn("Failed to delete forever from Supabase:", err);
  }

  return true;
}
