-- Migration: Enforce unique phone numbers across active employees
-- Normalizes phone formats (national 0... and international 855...) so duplicate numbers
-- cannot be registered in the system under any formatting.

CREATE OR REPLACE FUNCTION public.normalize_phone(raw_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN raw_phone IS NULL THEN NULL
    WHEN length(regexp_replace(raw_phone, '\D', '', 'g')) < 6 THEN NULL
    WHEN regexp_replace(raw_phone, '\D', '', 'g') LIKE '855%' AND length(regexp_replace(raw_phone, '\D', '', 'g')) >= 11
      THEN '0' || substring(regexp_replace(raw_phone, '\D', '', 'g') FROM 4)
    ELSE regexp_replace(raw_phone, '\D', '', 'g')
  END;
$$;

DROP INDEX IF EXISTS public.employees_phone_unique_idx;

CREATE UNIQUE INDEX employees_phone_unique_idx
ON public.employees (public.normalize_phone(phone))
WHERE deleted_at IS NULL AND public.normalize_phone(phone) IS NOT NULL;
