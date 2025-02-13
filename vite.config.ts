import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: resolve('./src/renderer'),
  base: './',
  build: {
    outDir: resolve('./dist/renderer'),
    emptyOutDir: true
  }
}); 