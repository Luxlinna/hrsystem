import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Creating leave_entitlement_rules table in Supabase PostgreSQL...");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.leave_entitlement_rules (
      id text PRIMARY KEY,
      code text NOT NULL UNIQUE,
      name text NOT NULL,
      leave_type_codes text[] NOT NULL DEFAULT '{}',
      total_employee integer DEFAULT 0,
      remark text DEFAULT '',
      status text NOT NULL DEFAULT 'Active',
      target_criteria jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.leave_entitlement_rules ENABLE ROW LEVEL SECURITY;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_entitlement_rules' AND policyname = 'leave_entitlement_rules_select') THEN
        CREATE POLICY "leave_entitlement_rules_select" ON public.leave_entitlement_rules FOR SELECT TO public USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_entitlement_rules' AND policyname = 'leave_entitlement_rules_insert') THEN
        CREATE POLICY "leave_entitlement_rules_insert" ON public.leave_entitlement_rules FOR INSERT TO public WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_entitlement_rules' AND policyname = 'leave_entitlement_rules_update') THEN
        CREATE POLICY "leave_entitlement_rules_update" ON public.leave_entitlement_rules FOR UPDATE TO public USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_entitlement_rules' AND policyname = 'leave_entitlement_rules_delete') THEN
        CREATE POLICY "leave_entitlement_rules_delete" ON public.leave_entitlement_rules FOR DELETE TO public USING (true);
      END IF;
    END $$;
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO public.leave_entitlement_rules (id, code, name, leave_type_codes, total_employee, remark, status, target_criteria)
    VALUES
      ('rule-expat', 'Expat', 'Expatriate Entitlement Rule', ARRAY['AL', 'SL', 'SP', 'ML', 'CL'], 3, 'For expatriates only', 'Active', '{"type": "nationality", "values": ["Expat", "Foreigner", "Non-Cambodian"]}'::jsonb),
      ('rule-local', 'Local', 'Local Employee Entitlement Rule', ARRAY['AL', 'SL', 'SP', 'ML', 'CL'], 130, 'Applicable for all Cambodian employees', 'Active', '{"type": "nationality", "values": ["Khmer", "Cambodian", "Local"]}'::jsonb)
    ON CONFLICT (code) DO NOTHING;
  `);

  const rows = await prisma.$queryRawUnsafe(`
    SELECT * FROM public.leave_entitlement_rules ORDER BY created_at;
  `);

  console.log("Successfully created and seeded leave_entitlement_rules table!");
  console.log("Current rows:", JSON.stringify(rows, null, 2));

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
