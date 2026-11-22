import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// Solo el texto de la versión llega al bundle, no package.json completo.
const { version } = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);

// https://vite.dev/config/
export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(version),
  },

  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    tailwindcss(),
    // PWA instalable (ADR-0006). Sin modo offline (ADR-0005): solo se
    // precachea el app shell y nunca la API ni datos de salud (C-PWA-2).
    VitePWA({
      registerType: 'prompt',
      // El registro lo hace src/app/pwa/registerServiceWorker.js.
      injectRegister: false,
      // Los íconos ya entran por globPatterns; evita duplicarlos.
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'Brisa · Apoyo psicoeducativo',
        short_name: 'Brisa',
        description:
          'Brisa: acompañamiento psicoeducativo para estudiantes ' +
          'universitarios, a tu ritmo.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        // El manifest no lee variables CSS: copias de tokens.css.
        // --brand-700 y --surface-bg (--neutral-50).
        theme_color: '#11534C',
        background_color: '#FAF9F6',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Material de marca, no forma parte de la app.
        globIgnores: ['brisa-identidad/**'],
        navigateFallback: '/index.html',
        // /api es el proxy de Cloudflare hacia el backend: nunca desde caché.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(
        new URL('./src', import.meta.url),
      ),
    },
  },
});