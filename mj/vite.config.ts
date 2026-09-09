import { svelte } from '@sveltejs/vite-plugin-svelte';
import { photoTitles } from '../gallery/plugins/photo-titles';
import { captionDrop } from '../gallery/plugins/caption-drop';
import ports from '../tools/hub/ports.json';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // gallery's two plugins, run here over mj's own assets: the titles inside every picture,
  // and the dev server's routes for editing.
  plugins: [svelte(), photoTitles(), captionDrop()],
  resolve: {
    // "core" and "gallery" are aliases for the two libraries one folder over; tsconfig
    // teaches the checker the same aliases, and the two must always agree. mj keeps no
    // vitest config of its own, so the test runner reads this one too.
    alias: {
      core: resolve(__dirname, '../core/src/lib'),
      gallery: resolve(__dirname, '../gallery/src'),
    },
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
