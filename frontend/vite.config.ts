import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const backendPort = process.env.DOUCOOK_BACKEND_PORT || '8899'

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
      },
    },
  },
})
