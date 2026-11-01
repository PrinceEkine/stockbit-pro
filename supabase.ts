
import { createClient } from '@supabase/supabase-js';

// Supabase project credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://blrlykycdtphdxtonlja.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey && import.meta.env.DEV) {
  console.warn('[supabase] VITE_SUPABASE_ANON_KEY is missing. Copy the "anon public" key from Supabase Dashboard → Project Settings → API into your .env file.');
}

// Standard client initialization
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
