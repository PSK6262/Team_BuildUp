import react from '@vitejs/plugin-react'
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Eclipse/Tomcat deploys this project's backend under /BuildUp_BE.
  const proxy = {
    '/api': {
      target: env.API_PROXY_TARGET || 'http://localhost:8080/BuildUp_BE',
      changeOrigin: true,
    },
  }
  return {
    plugins: [react()],
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
      proxy,
    },
    preview: { proxy },
  }
})

