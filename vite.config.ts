import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
    minify: false, // 🚀 Disable minification to prevent tree-shaking issues
    commonjsOptions: {
      include: [/node_modules/], // 🚀 Ensure CommonJS modules are not removed
    },
    rollupOptions: {
      external: [], // 🚀 Ensure all dependencies are bundled
      output: {
        manualChunks: undefined, // 🚀 Prevent Vite from separating chunks
      },
    },
    chunkSizeWarningLimit: 5000, // 🚀 Allow large chunks to prevent missing pages
  },
  server: {
    hmr: {
      overlay: true,
      timeout: 30000,
    },
  },
});
