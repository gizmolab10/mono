import { svelte } from '@sveltejs/vite-plugin-svelte';
import ports from '../notes/tools/hub/ports.json';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: ports.ov.port,
    strictPort: true,
    // Overview reads the guide files, which live outside its own folder — one level up,
    // in each project's notes. Without this the dev server refuses to serve them.
    fs: { allow: ['..'] },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: ports.ov.port,
    },
  },
});
