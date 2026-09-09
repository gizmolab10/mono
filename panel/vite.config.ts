import { svelte } from '@sveltejs/vite-plugin-svelte';
import ports from '../tools/hub/ports.json';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    // "core" is an alias for the shared library one folder over; tsconfig teaches
    // the checker the same alias, and the two must always agree.
    alias: { core: resolve(__dirname, '../core/src/lib') },
  },
  server: {
    port: ports.panel.port,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: ports.panel.port,
    },
  },
});
