-- Add image_url to meeting_rooms table for storing AWS S3 photo URLs
ALTER TABLE IF EXISTS public.meeting_rooms
  ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;
