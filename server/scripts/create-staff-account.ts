import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createStaffAccount(email: string, pass: string, role = 'staff') {
  console.log(`👤 Creating staff account: ${email} (role: ${role})...`);
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: pass,
    email_confirm: true,
    user_metadata: { role },
  });

  if (error) {
    console.error('❌ Failed to create user:', error.message);
  } else {
    console.log('✅ Staff account created successfully:', data.user?.id);
  }
}

const args = process.argv.slice(2);
const emailArg = args[0] || 'staff.demo@hrmsystem.local';
const passArg = args[1] || 'StaffDemo@2026';

createStaffAccount(emailArg, passArg);
