import { supabase } from "@/lib/supabase";
import type { OfferLetter } from "../../types";

const LOCAL_STORAGE_KEY = "hrm_offer_letters_store";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
      setLocalOffers(data as OfferLetter[]);
      return data as OfferLetter[];
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
  let updatedOffer: OfferLetter = { ...offer, updated_at: now };

  // Ensure ID is a valid UUID for Supabase
  if (!UUID_REGEX.test(updatedOffer.id)) {
    updatedOffer.id = crypto.randomUUID();
  }

  // Check if an existing row with the same offer_number or candidate_id exists in Supabase
  let existingRemoteId: string | null = null;
  try {
    if (updatedOffer.offer_number) {
      const { data: byNum } = await supabase
        .from("offer_letters")
        .select("id")
        .eq("offer_number", updatedOffer.offer_number)
        .maybeSingle();
      if (byNum?.id) existingRemoteId = byNum.id;
    }
    if (!existingRemoteId && updatedOffer.candidate_id) {
      const { data: byCand } = await supabase
        .from("offer_letters")
        .select("id")
        .eq("candidate_id", updatedOffer.candidate_id)
        .maybeSingle();
      if (byCand?.id) existingRemoteId = byCand.id;
    }
  } catch {
    // Ignore network errors
  }

  if (existingRemoteId) {
    updatedOffer.id = existingRemoteId;
  }

  // Always update local cache immediately for responsive UI
  const current = getLocalOffers();
  const filtered = current.filter(
    (o) =>
      o.id !== updatedOffer.id &&
      (!updatedOffer.offer_number || o.offer_number?.toUpperCase() !== updatedOffer.offer_number.toUpperCase())
  );
  filtered.unshift(updatedOffer);
  setLocalOffers(filtered);

  // Save to Supabase: use UPDATE if already exists, INSERT if brand new
  try {
    if (existingRemoteId) {
      const { error: updateError } = await supabase
        .from("offer_letters")
        .update(updatedOffer)
        .eq("id", existingRemoteId);

      if (updateError) {
        console.warn("Could not update offer letter in Supabase remote:", updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from("offer_letters")
        .insert(updatedOffer);

      if (insertError) {
        // If race condition on offer_number occurred, update existing row
        if (insertError.code === "23505" && updatedOffer.offer_number) {
          await supabase
            .from("offer_letters")
            .update(updatedOffer)
            .eq("offer_number", updatedOffer.offer_number);
        } else {
          console.warn("Could not insert offer letter in Supabase remote:", insertError.message);
        }
      }
    }
  } catch (err) {
    console.warn("Supabase save failed, stored in local storage cache:", err);
  }

  return updatedOffer;
}

export async function softDeleteOfferLetter(offerId: string, deletedBy?: string): Promise<boolean> {
  const now = new Date().toISOString();
  const current = getLocalOffers();
  const target = current.find((o) => o.id === offerId || o.offer_number === offerId);
  const resolvedId = target?.id || offerId;

  const updated = current.map((o) =>
    o.id === resolvedId || o.id === offerId ? { ...o, deleted_at: now, deleted_by: deletedBy || null } : o
  );
  setLocalOffers(updated);

  try {
    const { error } = await supabase
      .from("offer_letters")
      .update({ deleted_at: now, deleted_by: deletedBy || null })
      .eq("id", resolvedId);
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
  const target = current.find((o) => o.id === offerId || o.offer_number === offerId);
  const resolvedId = target?.id || offerId;

  const updated = current.map((o) =>
    o.id === resolvedId || o.id === offerId ? { ...o, deleted_at: undefined } : o
  );
  setLocalOffers(updated);

  try {
    const { error } = await supabase
      .from("offer_letters")
      .update({ deleted_at: null })
      .eq("id", resolvedId);
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
  const target = current.find((o) => o.id === offerId || o.offer_number === offerId);
  const resolvedId = target?.id || offerId;

  const updated = current.filter((o) => o.id !== resolvedId && o.id !== offerId);
  setLocalOffers(updated);

  try {
    const { error } = await supabase
      .from("offer_letters")
      .delete()
      .eq("id", resolvedId);
    if (error) {
      console.warn("Could not delete forever from Supabase, updated local cache:", error.message);
    }
  } catch (err) {
    console.warn("Failed to delete forever from Supabase:", err);
  }

  return true;
}

