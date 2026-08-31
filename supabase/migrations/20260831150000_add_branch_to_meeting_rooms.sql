-- Add branch_id, deleted_at, and amenities to meeting_rooms table
-- This allows each branch to have its own unique set of meeting rooms.

ALTER TABLE IF EXISTS public.meeting_rooms
  ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}'::text[];

-- Create an index on branch_id for faster queries
CREATE INDEX IF NOT EXISTS idx_meeting_rooms_branch_id ON public.meeting_rooms(branch_id);

-- Update RLS policies to allow insert/update/delete for authorized users
DROP POLICY IF EXISTS "meeting_rooms_insert" ON public.meeting_rooms;
CREATE POLICY "meeting_rooms_insert" ON public.meeting_rooms
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "meeting_rooms_update" ON public.meeting_rooms;
CREATE POLICY "meeting_rooms_update" ON public.meeting_rooms
  FOR UPDATE TO authenticated
  USING (true);

DROP POLICY IF EXISTS "meeting_rooms_delete" ON public.meeting_rooms;
CREATE POLICY "meeting_rooms_delete" ON public.meeting_rooms
  FOR DELETE TO authenticated
  USING (true);
