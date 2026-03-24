import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'buffer': 'buffer',
        'whatwg-fetch': path.resolve(__dirname, 'src/empty.js'),
        'whatwg-fetch/fetch.js': path.resolve(__dirname, 'src/empty.js'),
        'whatwg-fetch/dist/fetch.umd.js': path.resolve(__dirname, 'src/empty.js'),
        'cross-fetch': path.resolve(__dirname, 'src/empty.js'),
        'cross-fetch/dist/browser-polyfill.js': path.resolve(__dirname, 'src/empty.js'),
        'cross-fetch/dist/browser-ponyfill.js': path.resolve(__dirname, 'src/empty.js'),
      },
    },
    optimizeDeps: {
      include: ['buffer'],
      exclude: ['whatwg-fetch', 'cross-fetch'],
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
