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
  },
});
