import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
// base：构建产物用于 GitHub Pages 项目站点（https://<user>.github.io/webcreate/），
// 本地开发（dev）保持根路径，不受影响
// AI 问答：DeepSeek API 由浏览器直连（接口允许跨域），key 通过 .env 的 VITE_DEEPSEEK_API_KEY 注入
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/webcreate/' : '/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: false
  },
  build: {
    // 生产构建产物压缩与代码分割
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
}))
