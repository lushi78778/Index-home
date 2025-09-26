import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/config': path.resolve(__dirname, 'src/config'),
      '@/content': path.resolve(__dirname, 'content'),
      '@/app': path.resolve(__dirname, 'app'),
    },
  },
})
