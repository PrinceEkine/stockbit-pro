
import { createClient } from '@supabase/supabase-js';

// Environment variables are typically set in the deployment platform (e.g., Netlify, Vercel)
const supabaseUrl = (process.env.SUPABASE_URL as string) || 'https://YOUR_PROJECT_REF.supabase.co';
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY as string) || 'YOUR_ANON_PUBLIC_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
