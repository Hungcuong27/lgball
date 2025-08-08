import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 5173,
    https: false,
  },
  preview: {
    port: 4173,
    https: {
      key: undefined,
      cert: undefined,
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Tắt sourcemap cho production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          tonconnect: ['@tonconnect/ui-react'],
        },
      },
    },
  },
}); 