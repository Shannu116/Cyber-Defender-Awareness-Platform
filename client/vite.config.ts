import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: process.env.API_PROXY_URL || ('http://127.0.0.1:' + (2500 * 2)),
        changeOrigin: true,
      },
    },
  },
})
