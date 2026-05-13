import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: null,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff}'],
      },
      manifest: {
        name: 'KLAR 컨설팅',
        short_name: 'KLAR',
        description: '빛나는 당신을 위해 — 퍼스널컬러 & 메이크업 진단 허브',
        theme_color: '#EDF6FC',
        background_color: '#F2F7FB',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ko',
        scope: '/',
        start_url: '/',
        categories: ['lifestyle', 'business'],
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
})
