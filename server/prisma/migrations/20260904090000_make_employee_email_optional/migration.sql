-- Make email optional in employees table for biometric / field staff who have no email or system accounts
ALTER TABLE public.employees ALTER COLUMN email DROP NOT NULL;

-- Recreate unique index on email to only enforce uniqueness when email IS NOT NULL
DROP INDEX IF EXISTS employees_email_unique_idx;
CREATE UNIQUE INDEX employees_email_unique_idx 
  ON public.employees (lower(trim(email))) 
  WHERE email IS NOT NULL AND deleted_at IS NULL;
