-- document_folders and employment_contracts exist in production and are used by
-- the app (src/), but were never created by any migration (added ad hoc at some
-- point, like the candidates NSSF columns in 20260915120000). Captured here from
-- the live schema so a from-scratch environment has them too.

CREATE TABLE IF NOT EXISTS public.document_folders (
    id text NOT NULL,
    label text NOT NULL,
    icon text DEFAULT 'ri-folder-line'::text NOT NULL,
    color text DEFAULT 'text-blue-600'::text NOT NULL,
    bg text DEFAULT 'bg-blue-50'::text NOT NULL,
    description text,
    is_system boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    parent_id text,
    branch_id uuid,
    CONSTRAINT document_folders_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_document_folders_branch_id ON public.document_folders USING btree (branch_id);

ALTER TABLE public.document_folders
    DROP CONSTRAINT IF EXISTS document_folders_branch_id_fkey,
    ADD CONSTRAINT document_folders_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.document_folders
    DROP CONSTRAINT IF EXISTS document_folders_parent_id_fkey,
    ADD CONSTRAINT document_folders_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.document_folders(id) ON DELETE CASCADE;

ALTER TABLE public.document_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all read document_folders" ON public.document_folders;
CREATE POLICY "Allow all read document_folders" ON public.document_folders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert document_folders" ON public.document_folders;
CREATE POLICY "Allow all insert document_folders" ON public.document_folders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update document_folders" ON public.document_folders;
CREATE POLICY "Allow all update document_folders" ON public.document_folders FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow all delete document_folders" ON public.document_folders;
CREATE POLICY "Allow all delete document_folders" ON public.document_folders FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.employment_contracts (
    id text NOT NULL,
    contract_number text NOT NULL,
    candidate_id uuid,
    job_posting_id uuid,
    branch_id uuid,
    offer_id uuid,
    candidate_name text NOT NULL,
    candidate_email text,
    position_title text NOT NULL,
    department text NOT NULL,
    business_unit_name text NOT NULL,
    offer_reference text,
    contract_type text DEFAULT 'probationary'::text NOT NULL,
    start_date text NOT NULL,
    end_date text,
    probation_months integer DEFAULT 3,
    monthly_salary numeric DEFAULT 0,
    currency text DEFAULT 'USD'::text,
    work_schedule text,
    work_location text,
    contract_url text,
    signed_contract_url text,
    status text DEFAULT 'draft'::text NOT NULL,
    created_by_name text NOT NULL,
    hr_reviewer_name text,
    hr_reviewed_at timestamp with time zone,
    hr_review_notes text,
    hr_director_name text,
    hr_director_approved_at timestamp with time zone,
    hr_director_notes text,
    chairwoman_name text,
    chairwoman_approved_at timestamp with time zone,
    chairwoman_notes text,
    issued_at timestamp with time zone,
    issued_by_name text,
    signed_at timestamp with time zone,
    signed_by_candidate boolean DEFAULT false,
    signed_by_company boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    deleted_by uuid,
    CONSTRAINT employment_contracts_pkey PRIMARY KEY (id),
    CONSTRAINT employment_contracts_contract_number_key UNIQUE (contract_number)
);

ALTER TABLE public.employment_contracts
    DROP CONSTRAINT IF EXISTS employment_contracts_candidate_id_fkey,
    ADD CONSTRAINT employment_contracts_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE;

ALTER TABLE public.employment_contracts
    DROP CONSTRAINT IF EXISTS employment_contracts_offer_id_fkey,
    ADD CONSTRAINT employment_contracts_offer_id_fkey FOREIGN KEY (offer_id) REFERENCES public.offer_letters(id) ON DELETE SET NULL;

ALTER TABLE public.employment_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on employment_contracts" ON public.employment_contracts;
CREATE POLICY "Allow all on employment_contracts" ON public.employment_contracts USING (true) WITH CHECK (true);
