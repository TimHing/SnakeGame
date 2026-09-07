import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './', // 相對路徑：同一份 build 可以直接部署到 GitHub Pages（子路徑）跟 Firebase Hosting（根路徑）兩邊
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});
