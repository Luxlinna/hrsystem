-- Add documents jsonb column to candidates table to support multiple attachments stored in AWS S3.
alter table if exists candidates
  add column if not exists documents jsonb default '[]'::jsonb;
