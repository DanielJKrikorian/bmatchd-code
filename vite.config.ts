import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default defineConfig({
  plugins: [
    react(),
    commonjs(),
    nodeResolve({
      preferBuiltins: true,
      mainFields: ['module', 'main'],
    }),
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      'react-router-dom',
      'react-hot-toast',
      '@supabase/supabase-js',
      '@supabase/postgrest-js',
      'shallowequal',
    ],
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      // Point directly to the React and React-DOM entry points
      'react': '/Users/danielkrikorian/Desktop/bmatchd-code/node_modules/react/index.js',
      'react-dom': '/Users/danielkrikorian/Desktop/bmatchd-code/node_modules/react-dom/index.js',
      // Map jsx-runtime correctly
      'react/jsx-runtime': '/Users/danielkrikorian/Desktop/bmatchd-code/node_modules/react/jsx-runtime.js',
    },
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [
        /node_modules\/@supabase\/postgrest-js/,
        /node_modules\/@supabase\/supabase-js/,
        /node_modules\/react/,
        /node_modules\/react-dom/,
        /node_modules\/react-router/,
        /node_modules\/react-router-dom/,
        /node_modules\/react-hot-toast/,
        /node_modules\/shallowequal/,
      ],
    },
  },
  server: {
    hmr: {
      overlay: true,
      timeout: 30000,
    },
  },
});