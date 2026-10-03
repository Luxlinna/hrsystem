-- The onboarding checklist ("Document Collection" / "IT & Equipment Setup" /
-- "Training & Orientation" / "Final Sign-off" cards on the Onboarding page)
-- has no deadline concept — items only ever show "pending" or "complete".
-- HR asked for each item to carry a due date/time so an incomplete item past
-- its deadline reads as overdue in the checklist. Overdue itself stays a
-- client-computed state (due_date < now && not complete), matching the
-- existing pattern in onboarding_checklist_tasks / the /onboarding-checklist
-- page, so no scheduled job is needed to flip anything in the database.

    alter table onboarding_documents add column if not exists due_date timestamptz;
