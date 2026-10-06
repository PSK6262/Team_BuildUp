import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base:'/Team_BuildUp/',
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{ name: 'vendor', test: /[\\/]node_modules[\\/]/ }],
        },
      },
    },
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET || 'https://psk6262buildup.duckdns.org',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
