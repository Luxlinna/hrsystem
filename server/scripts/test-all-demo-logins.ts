import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, anonKey);

const accounts = [
  { role: 'SuperAdmin', email: 'admin@hrmsystem.local', pass: 'Admin@2026' },
  { role: 'Staff', email: 'staff.demo@hrmsystem.local', pass: 'StaffDemo@2026' },
];

async function testLogins() {
  console.log('🧪 Testing Demo Logins...');
  for (const acc of accounts) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: acc.email,
      password: acc.pass,
    });
    if (error) {
      console.log(`❌ [${acc.role}] ${acc.email}: ${error.message}`);
    } else {
      console.log(`✅ [${acc.role}] ${acc.email}: SUCCESS (User ID: ${data.user?.id})`);
    }
  }
}

testLogins();
