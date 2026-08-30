import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "@/components/Toast";
import { getCurrentPosition } from "@/lib/geo";
import { geocodeAddress, loadGoogleMaps, reverseGeocode } from "@/lib/geocode";
import type { BranchFormState } from "../types";

interface UseBranchLocationProps {
  showAddModal: boolean;
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
}

export function useBranchLocation({ showAddModal, setForm }: UseBranchLocationProps) {
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [addressLookup, setAddressLookup] = useState("");
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const placesAutocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (!showAddModal || !addressInputRef.current) return;
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !addressInputRef.current || placesAutocompleteRef.current) return;
        const autocomplete = new (window as any).google.maps.places.Autocomplete(addressInputRef.current, {
          fields: ["formatted_address", "geometry", "name"],
          types: ["geocode", "establishment"],
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          const loc = place?.geometry?.location;
          if (!loc) {
            toast("Error", "That place doesn't include coordinates. Try a more specific address.", "error");
            return;
          }
          const formattedAddress = place.formatted_address || place.name || addressInputRef.current?.value || "";
          setAddressLookup(formattedAddress);
          setForm((f) => ({
            ...f,
            location: f.location || formattedAddress,
            latitude: loc.lat().toFixed(6),
            longitude: loc.lng().toFixed(6),
          }));
          toast("Location selected", "Coordinates added to the branch form.", "success");
        });
        placesAutocompleteRef.current = autocomplete;
      })
      .catch(() => {
        // Fallback handled by manual lookup
      });

    return () => {
      cancelled = true;
      if (placesAutocompleteRef.current) {
        (window as any).google?.maps?.event?.clearInstanceListeners(placesAutocompleteRef.current);
        placesAutocompleteRef.current = null;
      }
    };
  }, [showAddModal, setForm]);

  const useCurrentLocation = useCallback(async () => {
    setLocating(true);
    try {
      const pos = await getCurrentPosition();
      const lat = pos.latitude.toFixed(6);
      const lng = pos.longitude.toFixed(6);
      setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
      try {
        const addr = await reverseGeocode(pos.latitude, pos.longitude);
        setAddressLookup(addr);
        setForm((f) => ({ ...f, location: f.location || addr, latitude: lat, longitude: lng }));
      } catch {
        // Reverse geocoding optional
      }
      toast("Location acquired", `Coordinates set to ${lat}, ${lng}`, "success");
    } catch (err: any) {
      toast("Location error", err?.message || "Could not read your location. Check browser permissions.", "error");
    } finally {
      setLocating(false);
    }
  }, [setForm]);

  const handleGeocodeAddress = useCallback(async () => {
    const q = addressLookup.trim();
    if (!q) {
      toast("Address required", "Type an address or place name to look up.", "error");
      return;
    }
    setGeocoding(true);
    try {
      const result = await geocodeAddress(q);
      const lat = result.latitude.toFixed(6);
      const lng = result.longitude.toFixed(6);
      setForm((f) => ({
        ...f,
        location: f.location || result.formattedAddress,
        latitude: lat,
        longitude: lng,
      }));
      setAddressLookup(result.formattedAddress);
      toast("Address found", `Resolved to ${result.formattedAddress} (${lat}, ${lng})`, "success");
    } catch (err: any) {
      toast("Lookup failed", err?.message || "Could not find coordinates for that address.", "error");
    } finally {
      setGeocoding(false);
    }
  }, [addressLookup, setForm]);

  return {
    locating,
    geocoding,
    addressLookup,
    setAddressLookup,
    addressInputRef,
    useCurrentLocation,
    handleGeocodeAddress,
  };
}
