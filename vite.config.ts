import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config
export default defineConfig({
  plugins: [react()],
  root: resolve('./src/renderer'),
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      overlay: true
    }
  },
  publicDir: resolve('./public'),
  build: {
    outDir: resolve('./dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve('./src/renderer/index.html')
      }
    }
  }
}); 