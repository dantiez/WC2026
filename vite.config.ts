import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icons/apple-touch-icon.png'],
        manifest: {
          name: 'WC2026 · Đặt áo đội bóng',
          short_name: 'WC2026 Áo',
          description: 'Pick áo, size, số áo cho cả đội cho World Cup 2026.',
          lang: 'vi',
          theme_color: '#0d0d14',
          background_color: '#07070b',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png'},
            {src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png'},
            {
              src: '/icons/maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,woff2,png}'],
          // Don't precache the heavy team-photo background or export bundle.
          globIgnores: ['**/images/**', '**/exceljs-*.js'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            exceljs: ['exceljs'],
            'lucide-react': ['lucide-react'],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
