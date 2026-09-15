import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './', // 相對路徑，跟根目錄 Snake Game 一樣可以直接部署到任何子路徑或獨立網域
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5174, // 跟 Snake Game 的 5173 錯開，方便同時開兩個 dev server 對照測試
  },
});
