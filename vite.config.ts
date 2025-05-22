import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// Получаем текущую директорию файла
const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './client/src'),
      '@shared': resolve(__dirname, './shared'),
      '@assets': resolve(__dirname, './attached_assets')
    }
  },
  root: resolve(__dirname, './client'),
  build: {
    outDir: resolve(__dirname, './dist/public'),
    emptyOutDir: true
  }
});