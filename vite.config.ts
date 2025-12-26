import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  root: 'src',
  publicDir: '../public',

  plugins: [react(), tailwindcss()],

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    assetsDir: '',
    rollupOptions: {
      input: {
        popup: 'src/index.html',
        'scripts/utils/service': 'src/scripts/utils/service.ts',
        'scripts/utils/ocr': 'src/scripts/utils/ocr.ts',
        'scripts/overlay': 'src/scripts/overlay.ts',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
})
