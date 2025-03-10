import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(
        process.env.VITE_STRIPE_PUBLIC_KEY || env.VITE_STRIPE_PUBLIC_KEY
      ),
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'react-hot-toast',
        '@supabase/supabase-js',
        '@supabase/postgrest-js',
        'zustand',
        'lucide-react'
      ],
      force: true,
    },
    resolve: {
      alias: {
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      },
      dedupe: ['react', 'react-dom', '@supabase/supabase-js'],
    },
    build: {
      target: 'esnext',
      sourcemap: true,
      minify: false, // Prevents tree-shaking issues
      commonjsOptions: {
        include: [/node_modules/], // Ensures CommonJS modules are included
      },
      rollupOptions: {
        external: [], // Prevents external dependencies from breaking builds
        output: {
          manualChunks: undefined, // Prevents Vite from chunking
        },
      },
      chunkSizeWarningLimit: 5000, // Prevents warning about large chunks
    },
    server: {
      hmr: {
        overlay: true,
        timeout: 30000,
      },
    },
  };
});
