-- Migration: Ensure Work Locations have GPS coordinates and geofence
ALTER TABLE public.work_locations
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS geofence_radius_m int DEFAULT 100;

-- Update Kampong Thom site coordinates
UPDATE public.work_locations
SET 
  latitude = 12.7111,
  longitude = 104.8887,
  geofence_radius_m = 100
WHERE (name ILIKE '%Kampong Thom%' OR description ILIKE '%Kampong Thom%')
  AND (latitude IS NULL OR longitude IS NULL);

-- Also ensure any site without coordinates inherits default branch coordinates or 100m geofence
UPDATE public.work_locations wl
SET 
  latitude = b.latitude,
  longitude = b.longitude,
  geofence_radius_m = COALESCE(b.geofence_radius_m, 100)
FROM public.branches b
WHERE wl.branch_id = b.id
  AND wl.latitude IS NULL
  AND b.latitude IS NOT NULL;
