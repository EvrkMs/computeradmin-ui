import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { AmpersandIcon } from 'lucide-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5000,
    open: true,
    allowedHosts: ["admin.ava-kk.ru"],
    https: {
      
    }
  },
})
