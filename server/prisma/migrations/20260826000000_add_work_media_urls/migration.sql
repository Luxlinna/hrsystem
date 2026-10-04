-- Add JSONB columns for storing multiple media items (images + videos)
-- for outside work check-in and check-out.
-- Each column stores an array of objects: [{ url, type, name }]

alter table tasks
  add column if not exists work_media_urls jsonb,
  add column if not exists work_check_out_media_urls jsonb;

comment on column tasks.work_media_urls is 'Array of {url, type: "image"|"video", name} for check-in media stored in S3';
comment on column tasks.work_check_out_media_urls is 'Array of {url, type: "image"|"video", name} for check-out media stored in S3';
