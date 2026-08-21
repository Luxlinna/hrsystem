-- Checklist deadlines now get set automatically when onboarding starts
-- (see src/lib/onboarding.ts STAGE_DEFAULT_DUE_DAYS), anchored to the
-- onboarding request's created_at. That only covers newly-created requests
-- going forward — this backfills the still-in-progress ones that were
-- created before due dates existed, so their checklists start following
-- the same schedule instead of staying permanently dateless.

update onboarding_documents d
set due_date = r.created_at + (
  case d.stage
    when 'document' then interval '3 days'
    when 'it_setup' then interval '7 days'
    when 'training' then interval '14 days'
    when 'complete' then interval '21 days'
    else interval '7 days'
  end
)
from onboarding_requests r
where d.onboarding_request_id = r.id
  and d.due_date is null
  and d.status <> 'complete'
  and r.status <> 'completed';

update onboarding_checklist_tasks t
set due_date = (
  r.created_at + (
    case t.category
      when 'documents' then interval '3 days'
      when 'it_setup' then interval '7 days'
      when 'training' then interval '14 days'
      when 'general' then interval '21 days'
      else interval '7 days'
    end
  )
)::date
from onboarding_requests r
where t.onboarding_request_id = r.id
  and t.due_date is null
  and t.completed = false
  and r.status <> 'completed';
