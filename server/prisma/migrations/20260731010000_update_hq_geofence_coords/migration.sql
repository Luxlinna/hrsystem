-- Correct Phnom Penh HQ's geofence to the real office coordinates (the
-- earlier value was an approximate city-center placeholder). Radius stays
-- at 100m, matching the existing default.

update branches
set latitude = 11.5714, longitude = 104.8936, geofence_radius_m = 100
where name = 'Phnom Penh HQ';
