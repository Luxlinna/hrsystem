-- Notifications only ever linked to a module's list page (e.g. "/onboarding"),
-- never to the specific record they were about, because nothing captured
-- which record that was. Every notify() call site already computes the
-- record's id for its accompanying audit-log entry — store it here too so
-- clicking a notification can jump straight to (and highlight) that record.

alter table notifications add column if not exists entity_id uuid;
