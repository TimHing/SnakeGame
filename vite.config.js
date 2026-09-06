import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: '/SnakeGame/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
