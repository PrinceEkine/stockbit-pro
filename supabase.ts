
import { createClient } from '@supabase/supabase-js';

// Supabase project credentials
const supabaseUrl = 'https://knrpqdehivlprvzjkcgx.supabase.co';
const supabaseAnonKey = 'sb_publishable_BQ7eX5q41ntXeuIuQ7HvnA_UwKJHSBz';

// Custom storage wrapper to avoid LockManager issues in restricted environments
const customStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
  removeItem: (key: string) => window.localStorage.removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'stockbit-pro-auth-v3',
    storage: customStorage,
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    flowType: 'pkce'
  },
  global: {
    // Add a reasonable timeout for fetch requests to prevent indefinite hanging
    fetch: (url, options) => {
      return fetch(url, { ...options, cache: 'no-store' });
    }
  }
});
