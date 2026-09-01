import { svelte } from '@sveltejs/vite-plugin-svelte';
import ports from '../notes/tools/hub/ports.json';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    // "core" is an alias for the shared library one folder over; tsconfig teaches
    // the checker the same alias, and the two must always agree. mj keeps no
    // vitest config of its own, so the test runner reads this one too.
    alias: { core: resolve(__dirname, '../core/src/lib') },
  },
  server: {
    port: ports.mj.port,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: ports.mj.port,
    },
  },
});
