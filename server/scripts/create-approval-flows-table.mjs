import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Creating leave_approval_flows and leave_approval_groups tables in Supabase PostgreSQL...");

  // 1. leave_approval_flows table (for BU / Site specific approval flows)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.leave_approval_flows (
      id text PRIMARY KEY,
      unit_id text NOT NULL,
      unit_name text NOT NULL,
      is_site boolean DEFAULT false,
      flow_name text DEFAULT '',
      steps jsonb NOT NULL DEFAULT '[]'::jsonb,
      apply_to jsonb DEFAULT '{"departments": ["All"], "positions": ["All"], "employee_types": ["All"]}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT leave_approval_flows_unit_id_unique UNIQUE (unit_id)
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.leave_approval_flows ENABLE ROW LEVEL SECURITY;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_approval_flows' AND policyname = 'leave_approval_flows_select') THEN
        CREATE POLICY "leave_approval_flows_select" ON public.leave_approval_flows FOR SELECT TO public USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_approval_flows' AND policyname = 'leave_approval_flows_insert') THEN
        CREATE POLICY "leave_approval_flows_insert" ON public.leave_approval_flows FOR INSERT TO public WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_approval_flows' AND policyname = 'leave_approval_flows_update') THEN
        CREATE POLICY "leave_approval_flows_update" ON public.leave_approval_flows FOR UPDATE TO public USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_approval_flows' AND policyname = 'leave_approval_flows_delete') THEN
        CREATE POLICY "leave_approval_flows_delete" ON public.leave_approval_flows FOR DELETE TO public USING (true);
      END IF;
    END $$;
  `);

  // 2. leave_approval_groups table (for custom multi-criteria approval flow groups)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.leave_approval_groups (
      id text PRIMARY KEY,
      flow_name text NOT NULL,
      sort_order integer DEFAULT 15,
      sites text[] DEFAULT '{}',
      departments text[] DEFAULT '{}',
      positions text[] DEFAULT '{}',
      employee_types text[] DEFAULT '{}',
      steps jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE public.leave_approval_groups ENABLE ROW LEVEL SECURITY;
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_approval_groups' AND policyname = 'leave_approval_groups_select') THEN
        CREATE POLICY "leave_approval_groups_select" ON public.leave_approval_groups FOR SELECT TO public USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_approval_groups' AND policyname = 'leave_approval_groups_insert') THEN
        CREATE POLICY "leave_approval_groups_insert" ON public.leave_approval_groups FOR INSERT TO public WITH CHECK (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_approval_groups' AND policyname = 'leave_approval_groups_update') THEN
        CREATE POLICY "leave_approval_groups_update" ON public.leave_approval_groups FOR UPDATE TO public USING (true);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leave_approval_groups' AND policyname = 'leave_approval_groups_delete') THEN
        CREATE POLICY "leave_approval_groups_delete" ON public.leave_approval_groups FOR DELETE TO public USING (true);
      END IF;
    END $$;
  `);

  // Seed default for UNI Holding if not present
  const defaultUniSteps = [
    { id: "step-uni-1", conditionPrefix: "", approvalCondition: "AND", flowTitle: "Notified to", flowType: "Employee", description: "Chea Tiengchanvathna", condition: ">=0", step: 1, displayInPrint: true },
    { id: "step-uni-2", conditionPrefix: "AND", approvalCondition: "AND", flowTitle: "Notified to", flowType: "Employee", description: "Chey Tola", condition: ">=0", step: 1, displayInPrint: true },
    { id: "step-uni-3", conditionPrefix: "AND", approvalCondition: "AND", flowTitle: "Notified to", flowType: "Employee", description: "Thorng Dararithy", condition: ">=0", step: 1, displayInPrint: true },
  ];

  await prisma.$executeRawUnsafe(`
    INSERT INTO public.leave_approval_flows (id, unit_id, unit_name, is_site, flow_name, steps)
    VALUES (
      'flow-uni-holding',
      'cf4826f4-c8ee-4e58-a27d-1b4481eb91f7',
      'UNI Holding',
      false,
      'UNI Holding Standard Approval Flow',
      $1::jsonb
    )
    ON CONFLICT (unit_id) DO NOTHING;
  `, JSON.stringify(defaultUniSteps));

  const flows = await prisma.$queryRawUnsafe(`SELECT id, unit_id, unit_name, jsonb_array_length(steps) as steps_count FROM public.leave_approval_flows;`);
  console.log("Current leave_approval_flows:", flows);
}

main().catch(console.error).finally(() => prisma.$disconnect());
