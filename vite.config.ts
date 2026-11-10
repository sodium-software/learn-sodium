import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// learn.sodium.software — SPA estática servida por Cloudflare Pages.
// `base` relativo para que el build funcione tanto en la raíz del dominio
// como detrás de un prefijo (previsualizaciones de Cloudflare) sin tocar rutas.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2022',
  },
})
