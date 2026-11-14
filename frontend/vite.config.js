import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // El prerender (spec 022) lee el manifiesto para enlazar el CSS de cada página
  build: { manifest: true },
})
