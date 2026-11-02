import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],

    resolve: {
      // `@/components/Foo` instead of `../../components/Foo`.
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },

    server: {
      port: Number(env.VITE_PORT) || 5173,
      // Fail loudly rather than silently moving to another port, which would
      // put the dev server on an origin the backend's CORS list doesn't allow.
      strictPort: true,
      proxy: {
        // Optional: with VITE_API_BASE_URL left empty, requests go to /api on
        // this same origin and are proxied to Django, which sidesteps CORS
        // entirely during development.
        '/api': {
          target: env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },

    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
    },
  }
})
