import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';

/**
 * Admin-only Vite config — builds a completely separate bundle
 * to be deployed on the admin subdomain (e.g. admin.le-continent.com).
 *
 * Dev:     npm run dev:admin    →  http://localhost:5174/
 * Build:   npm run build:admin  →  dist-admin/  (deploy this folder to subdomain)
 * Preview: npm run preview:admin → http://localhost:4174/
 *
 * Environment variable (set in your hosting/CI environment):
 *   VITE_MAIN_SITE_URL=https://le-continent.com
 *   (defaults to / if not set — fine for dev)
 */

/** Serve admin.html for every client-side route in dev mode */
function adminHtmlPlugin(): Plugin {
  return {
    name: 'admin-html-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (
          req.url &&
          !req.url.includes('.') &&
          !req.url.startsWith('/@') &&
          !req.url.startsWith('/node_modules')
        ) {
          req.url = '/admin.html';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), adminHtmlPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    open: true,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  build: {
    outDir: 'dist-admin',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'admin.html'),
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  preview: {
    port: 4174,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
});
