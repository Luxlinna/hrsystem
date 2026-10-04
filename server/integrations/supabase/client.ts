import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Helper to invoke Supabase Edge Functions from the Express server
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string,
  body: Record<string, any>
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabaseAdmin.functions.invoke(functionName, {
      body,
    });
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}
