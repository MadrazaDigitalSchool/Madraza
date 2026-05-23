import { defineConfig } from 'vitest/config';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [
    angular() as any,
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.vitest.spec.ts'],
    setupFiles: ['src/vitest-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/app/core/services/**/*.ts'],
      exclude: ['**/*.spec.ts', '**/*.vitest.spec.ts']
    }
  },
});
