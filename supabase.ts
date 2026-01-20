
import { createClient } from '@supabase/supabase-js';

// Supabase project credentials
const supabaseUrl = 'https://knrpqdehivlprvzjkcgx.supabase.co';
const supabaseAnonKey = 'sb_publishable_BQ7eX5q41ntXeuIuQ7HvnA_UwKJHSBz';

// Standard client initialization
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
