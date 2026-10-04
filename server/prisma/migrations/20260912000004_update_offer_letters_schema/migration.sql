-- Migration: Add signatories column and update status check constraint on offer_letters
-- Allows the 4-tier recruitment authorization statuses ('pending_bu_ceo', 'pending_hr_manager', 'pending_hr_director', 'pending_chairwoman')
-- and stores executive signatory audit metadata across BU CEO, HR Manager, HR Admin Director, and Chairwoman.

alter table public.offer_letters add column if not exists signatories jsonb default '{}'::jsonb;

alter table public.offer_letters drop constraint if exists offer_letters_status_check;

alter table public.offer_letters add constraint offer_letters_status_check check (
  status in (
    'salary_proposal',
    'pending_bu_ceo',
    'pending_hr_manager',
    'pending_hr_director',
    'pending_chairwoman',
    'approved',
    'issued',
    'accepted',
    'rejected',
    'salary_approved',
    'draft_letter',
    'hr_review',
    'management_approval'
  )
);
