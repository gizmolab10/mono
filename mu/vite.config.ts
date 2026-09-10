import { svelte } from '@sveltejs/vite-plugin-svelte';
import ports from '../tools/hub/ports.json';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    // "core" and "panel" are aliases for the two libraries one folder over; tsconfig
    // teaches the checker the same aliases, and the two must always agree.
    alias: {
      core: resolve(__dirname, '../core/src/lib'),
      panel: resolve(__dirname, '../panel/src/lib'),
    },
  },
  server: {
    port: ports.mu.port,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: ports.mu.port,
    },
  },
});
