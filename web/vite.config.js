import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// The frontend talks to Express through a stable relative path so the same
// build works locally and behind the production reverse proxy.
const API_TARGET = process.env.API_URL || 'http://localhost:3001'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    proxy: {
      '/hcgi/api': {
        target: API_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/hcgi\/api/, ''),
      },
    },
  },
  preview: {
    port: 3000,
  },
})
