import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

export default defineConfig({
  plugins: [svelte()],
  define: {
    // This config's own folder, not where vitest was launched — so a run from the
    // repo's top finds the same assets a run from here does.
    __ASSETS_DIR__: JSON.stringify(resolve(dirname(fileURLToPath(import.meta.url)), 'src/assets')),
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
