import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api/football': {
        target: 'https://api.football-data.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/football/, ''),
      },
      '/api/f1': {
        target: 'https://api.jolpi.ca',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/f1/, ''),
      },
      '/api/bbc-sport': {
        target: 'https://feeds.bbci.co.uk',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bbc-sport/, ''),
      },
      '/api/weather': {
        target: 'https://api.open-meteo.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/weather/, ''),
      },
      '/api/men': {
        target: 'https://www.manchestereveningnews.co.uk',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/men/, ''),
      },
      '/api/guardian': {
        target: 'https://www.theguardian.com',
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/api\/guardian/, ''),
      },
      '/api/itunes': {
        target: 'https://itunes.apple.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/itunes/, ''),
      },
      '/api/gamespot': {
        target: 'https://www.gamespot.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gamespot/, ''),
      },
    },
  },
})
