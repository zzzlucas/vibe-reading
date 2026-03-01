import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

import Icons from 'unplugin-icons/vite';
import IconsResolver from 'unplugin-icons/resolver';
import Components from 'unplugin-vue-components/vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export default defineConfig({
  root: '.',
  plugins: [
    vue(),
    Components({
      resolvers: [
        IconsResolver({
          prefix: 'icon',
          enabledCollections: ['material-symbols']
        }),
      ],
    }),
    Icons({
      autoInstall: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Cache all build assets on install
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2,ttf,eot}'],
        // Don't let cache grow stale — update SW on every new build
        cleanupOutdatedCaches: true,
        // Skip waiting so new SW activates immediately
        skipWaiting: true,
        clientsClaim: true,
        // Cache-first for all precached assets
        runtimeCaching: [
          {
            // Gemini favicon hosted externally — cache with network-first fallback
            urlPattern: /^https:\/\/www\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-assets',
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      },
      manifest: {
        name: 'DeepReader',
        short_name: 'DeepReader',
        description: 'AI Assistant — Local Document Reader',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-512.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/pwa-512.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        // Enable PWA in dev mode for easier testing (disable if it causes issues)
        enabled: false,
        type: 'module'
      }
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html',
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
