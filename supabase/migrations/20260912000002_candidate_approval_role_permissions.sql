-- Migration: Candidate Approval Role Permissions
-- Adds granular signing permissions to app_roles for Candidate Approval Form (CAF) steps

alter table public.app_roles
  add column if not exists candidate_approval_ceo_sign boolean not null default false,
  add column if not exists candidate_approval_hr_sign boolean not null default false,
  add column if not exists candidate_approval_director_sign boolean not null default false,
  add column if not exists candidate_approval_chairwoman_sign boolean not null default false;
