import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '~': new URL('./src', import.meta.url).pathname,
    },
  },
  clearScreen: false,
  test: {
    coverage: {
      provider: 'v8',
    },
  },
})
