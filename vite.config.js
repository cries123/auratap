import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolveSiteUrl } from './scripts/site-url.mjs'

// In development, /api goes to the Functions emulator (`npm run serve` in functions/),
// mirroring the Firebase Hosting rewrite used in production.
const emulatorProject = process.env.FUNCTIONS_EMULATOR_PROJECT || 'auratap-ee8a0'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    // index.html uses %VITE_PUBLIC_SITE_URL% for canonical and link-preview tags.
    // Values already in process.env take priority over .env files in Vite.
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    process.env.VITE_PUBLIC_SITE_URL = resolveSiteUrl(env.VITE_PUBLIC_SITE_URL).url
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5001',
          changeOrigin: true,
          rewrite: (path) => `/${emulatorProject}/us-central1/api${path}`,
        },
      },
    },
  }
})
