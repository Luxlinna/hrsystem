import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. SAFETY FIRST: Ensure we ONLY target the test database
    const dbUrl = process.env.DATABASE_URL || '';
    const supabaseUrl = process.env.SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const isTest = dbUrl.includes('mltkqbcjavgfclitgvin') && supabaseUrl.includes('mltkqbcjavgfclitgvin');
    if (!isTest) {
      console.error('❌ SAFETY ABORT: Not connected to test database (mltkqbcjavgfclitgvin)!');
      console.error('DATABASE_URL:', dbUrl);
      console.error('SUPABASE_URL:', supabaseUrl);
      process.exit(1);
    }

    console.log('🔍 Verified: Connected to TEST database mltkqbcjavgfclitgvin ✅');

    const adminEmail = 'hrmsystem.ops@gmail.com';
    const adminPassword = 'superadmin123';

    // 2. Supabase Auth: Create or Update user with password
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    console.log(`\nCreating/updating Supabase Auth user: ${adminEmail}...`);
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.warn('Warning listing users:', listError.message);
    }

    let authUser = listData?.users?.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());

    if (authUser) {
      console.log(`Found existing auth user (${authUser.id}). Updating password and confirming email...`);
      const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
        authUser.id,
        {
          password: adminPassword,
          email_confirm: true,
          user_metadata: { name: 'Super Admin', full_name: 'Super Admin' }
        }
      );
      if (updateError) throw updateError;
      authUser = updated.user;
      console.log('✅ Auth user password updated successfully!');
    } else {
      console.log('Creating new auth user in Supabase Auth...');
      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: 'Super Admin', full_name: 'Super Admin' }
      });
      if (createError) throw createError;
      authUser = created.user;
      console.log(`✅ Auth user created successfully (${authUser.id})!`);
    }

    // 3. Find Super Admin role in app_roles
    let superAdminRole = await prisma.app_roles.findFirst({
      where: { name: 'Super Admin' }
    });

    if (!superAdminRole) {
      superAdminRole = await prisma.app_roles.findFirst({
        where: { is_admin: true }
      });
    }


    if (!superAdminRole) {
      console.log('Creating Super Admin role in app_roles...');
      superAdminRole = await prisma.app_roles.create({
        data: {
          name: 'Super Admin',
          description: 'Full access to every module',
          color: '#0D7377',
          is_admin: true,
          allowed_modules: ['*']
        }
      });
    }
    console.log(`✅ Super Admin role identified: id=${superAdminRole.id}, name=${superAdminRole.name}`);

    // 4. Upsert user_role_assignments
    console.log('Updating user_role_assignments...');
    const existingURA = await prisma.user_role_assignments.findFirst({
      where: { email: adminEmail }
    });

    if (existingURA) {
      await prisma.user_role_assignments.update({
        where: { id: existingURA.id },
        data: {
          user_id: authUser.id,
          role_id: superAdminRole.id,
          display_name: 'Super Admin',
          deleted_at: null,
          deleted_by: null
        }
      });
      console.log('✅ Existing user_role_assignments updated to Super Admin role!');
    } else {
      await prisma.user_role_assignments.create({
        data: {
          user_id: authUser.id,
          email: adminEmail,
          role_id: superAdminRole.id,
          display_name: 'Super Admin'
        }
      });
      console.log('✅ user_role_assignments created with Super Admin role!');
    }

    // 5. Ensure an active employee record exists for this email
    console.log('Checking employees table...');
    const existingEmp = await prisma.$queryRawUnsafe(
      `SELECT id FROM public.employees WHERE lower(email) = lower($1) LIMIT 1`,
      adminEmail
    );

    if (existingEmp && existingEmp.length > 0) {
      await prisma.$executeRawUnsafe(
        `UPDATE public.employees SET status = 'active', role = 'Super Admin', deleted_at = NULL WHERE id = $1`,
        existingEmp[0].id
      );
      console.log('✅ Existing employee record updated to active!');
    } else {
      const branches = await prisma.$queryRawUnsafe(
        `SELECT id FROM public.branches LIMIT 1`
      );
      const branchId = branches[0]?.id || null;

      await prisma.$executeRawUnsafe(
        `INSERT INTO public.employees (id, first_name, last_name, email, role, department, branch_id, status)
         VALUES (gen_random_uuid(), 'Super', 'Admin', $1, 'Super Admin', 'IT', $2::uuid, 'active')`,
        adminEmail,
        branchId
      );

      console.log('✅ Employee record created!');
    }


    console.log('\n🎉 ALL DONE! Super Admin successfully seeded:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Project:  ${supabaseUrl}\n`);
  } catch (err) {
    console.error('❌ Error seeding super admin:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
