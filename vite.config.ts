import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['@supabase/supabase-js', '@supabase/postgrest-js', 'react', 'react-dom'],
  },
  resolve: {
    // Remove or adjust alias to avoid conflicts
    // '@supabase/postgrest-js': '@supabase/postgrest-js/dist/module/index.js', // Comment or remove if ESM fails
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules\/@supabase\/postgrest-js/, /node_modules\/@supabase\/supabase-js/, /node_modules\/react/, /node_modules\/react-dom/],
    },
  },
  server: {
    hmr: {
      overlay: true,
      timeout: 30000,
    },
  },
});