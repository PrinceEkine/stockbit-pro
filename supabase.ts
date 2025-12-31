
import { createClient } from '@supabase/supabase-js';

// Supabase project credentials provided by the user
const supabaseUrl = 'https://knrpqdehivlprvzjkcgx.supabase.co';
const supabaseAnonKey = 'sb_publishable_BQ7eX5q41ntXeuIuQ7HvnA_UwKJHSBz';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
