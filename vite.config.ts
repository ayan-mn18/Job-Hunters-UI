import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // NOTE: 6000 is on every browser's unsafe-port list (it is the X11 port),
    // so the dev server must not use it — Chrome shows ERR_UNSAFE_PORT.
    port: Number(process.env.PORT) || 6100,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
