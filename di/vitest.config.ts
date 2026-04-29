import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  define: {
    __BUILD_NOTES__: JSON.stringify(''),
    __BUILD_NUMBER__: 0,
    __ASSETS_DIR__: JSON.stringify(resolve(process.cwd(), 'src/assets')),
  },
  test: {
    setupFiles: ['src/lib/ts/tests/setup.ts'],
    globals: true,
    // Browser-driven tests live under e2e/ and run with Playwright via
    // `yarn e2e`. Keep the unit-test runner pointed at src/ only.
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
  },
});
