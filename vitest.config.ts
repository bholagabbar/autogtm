import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./apps/autogtm/vitest.setup.ts'],
    include: ['apps/**/*.test.ts', 'apps/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/autogtm/src'),
      '@autogtm/core': path.resolve(__dirname, 'packages/autogtm-core/src'),
    },
  },
});
