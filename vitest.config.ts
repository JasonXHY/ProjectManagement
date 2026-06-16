import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // 排除构建产物，避免拾取编译后的 .js 测试副本
    exclude: ['**/node_modules/**', '**/dist/**', 'electron/dist/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './electron/shared'),
    },
  },
})
