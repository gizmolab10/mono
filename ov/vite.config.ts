import { svelte } from '@sveltejs/vite-plugin-svelte';
import ports from '../notes/tools/hub/ports.json';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    // "core" is a nickname for the shared library one folder over; tsconfig teaches
    // the checker the same nickname, and the two must always agree.
    alias: { core: path.resolve(__dirname, '../core/src/lib') },
  },
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
