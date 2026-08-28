import { svelte } from '@sveltejs/vite-plugin-svelte';
import ports from '../notes/tools/hub/ports.json';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
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
