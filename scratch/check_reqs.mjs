import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const getEnv = (k) => {
  const line = env.split('\n').find((l) => l.startsWith(`${k}=`));
  return line ? line.slice(k.length + 1).trim().replace(/^['"]|['"]$/g, '') : null;
};
const supabase = createClient(getEnv('SUPABASE_URL'), getEnv('SUPABASE_SERVICE_ROLE_KEY'));

const { data } = await supabase.from('hiring_requests').select('id, title, status, hr_reviewed_by, hr_admin_approved_by, chairman_approved_by');
console.log('Hiring requests:', data);
