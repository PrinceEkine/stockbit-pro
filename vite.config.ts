import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Only VITE_-prefixed variables reach the browser bundle. AI provider keys are
// deliberately NOT exposed any more — they live in the `ai-gateway` Edge Function.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      port: 3000,
      hmr: false
    },
    define: {
      'process.env.VITE_PAYSTACK_PUBLIC_KEY': JSON.stringify(env.VITE_PAYSTACK_PUBLIC_KEY || ''),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    },
    build: {
      sourcemap: false,
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            supabase: ['@supabase/supabase-js'],
            charts: ['recharts'],
            motion: ['motion'],
          }
        }
      }
    }
  };
});
