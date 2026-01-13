import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    setupFiles: ['src/lib/ts/tests/setup.ts'],
    globals: true,
  },
});
