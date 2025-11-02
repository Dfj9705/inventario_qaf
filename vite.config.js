import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',             // usa @vitest/coverage-v8
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage'
    }
  },
})
