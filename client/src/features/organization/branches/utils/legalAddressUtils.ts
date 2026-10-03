export interface LegalAddressParts {
  no: string;
  street: string;
  group: string;
  village: string;
  sangkat: string;
  district: string;
  municipality: string;
}

export function parseLegalAddress(raw?: string | null): LegalAddressParts {
  const empty: LegalAddressParts = {
    no: "",
    street: "",
    group: "",
    village: "",
    sangkat: "",
    district: "",
    municipality: "",
  };
  if (!raw) return empty;

  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        no: parsed.no || "",
        street: parsed.street || "",
        group: parsed.group || "",
        village: parsed.village || "",
        sangkat: parsed.sangkat || "",
        district: parsed.district || "",
        municipality: parsed.municipality || "",
      };
    }
  } catch {
    // Fallback if plain text
  }

  return { ...empty, municipality: raw };
}

export function formatLegalAddress(parts: LegalAddressParts): string {
  return JSON.stringify(parts);
}

export function formatLegalAddressDisplay(raw?: string | null): string {
  if (!raw) return "";
  const parts = parseLegalAddress(raw);
  const items = [
    parts.no ? `No ${parts.no}` : "",
    parts.street ? `Street ${parts.street}` : "",
    parts.group ? `Group ${parts.group}` : "",
    parts.village ? `Village ${parts.village}` : "",
    parts.sangkat ? `Sangkat ${parts.sangkat}` : "",
    parts.district ? `District ${parts.district}` : "",
    parts.municipality ? parts.municipality : "",
  ].filter(Boolean);

  return items.length > 0 ? items.join(", ") : raw;
}
