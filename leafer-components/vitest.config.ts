import { resolve } from 'path'

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'leafer-components',
    include: ['./__tests__/**/*.spec.ts'],
    environment: 'happy-dom',
  },
  resolve: {
    alias: {
      '@tmagic/core': resolve(__dirname, '../../packages/core/src'),
      '@tmagic/schema': resolve(__dirname, '../../packages/schema/src'),
    },
  },
})
