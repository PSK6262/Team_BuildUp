import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': {
<<<<<<< HEAD
        target: 'http://localhost:8080',
=======
        target: 'http://192.168.0.66:8080',
>>>>>>> aceadb622c4e41c3dd9df3de47e577996a92ee88
        changeOrigin: true,
      },
    },
  },
})

