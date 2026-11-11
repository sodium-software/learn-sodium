import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// VITE_STATIC=1 genera la copia que se abre sin servidor (file://): rutas
// relativas, un solo script clásico (los módulos ES no cargan desde file://)
// y sin panel. Ver scripts/package-handover.mjs.
const isStatic = process.env.VITE_STATIC === '1'

const classicScript: Plugin = {
  name: 'classic-script',
  enforce: 'post',
  transformIndexHtml: (html) =>
    html.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/, '<script defer src="$1"></script>').replace(/ crossorigin/g, ''),
}

export default defineConfig({
  base: isStatic ? './' : '/',
  plugins: [react(), tailwindcss(), ...(isStatic ? [classicScript] : [])],
  build: {
    outDir: isStatic ? 'dist-static' : 'dist',
    sourcemap: false,
    target: 'es2022',
    modulePreload: !isStatic,
    rollupOptions: isStatic ? { output: { format: 'iife', inlineDynamicImports: true } } : undefined,
  },
})
