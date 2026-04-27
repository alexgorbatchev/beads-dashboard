import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

function getAllowedHosts(rawAllowedHosts: string | undefined): string[] {
  if (!rawAllowedHosts) {
    return []
  }

  return rawAllowedHosts
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean)
}
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    allowedHosts: getAllowedHosts(process.env.ALLOWED_HOSTS),
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:3001',
        ws: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
