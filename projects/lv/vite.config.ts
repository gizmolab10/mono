import { svelte } from '@sveltejs/vite-plugin-svelte';
import { photoTitles } from '../libraries/gallery/plugins/photo-titles';
import { captionDrop } from '../libraries/gallery/plugins/caption-drop';
import ports from '../../tools/hub/ports.json';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // gallery's two plugins, run here over lv's own assets: the titles inside every picture,
  // and the dev server's routes for editing.
  plugins: [svelte(), photoTitles(), captionDrop()],
  resolve: {
    // "core", "panel" and "gallery" are aliases for the three libraries in the libraries folder;
    // tsconfig teaches the checker the same aliases, and the two must always agree. lv's code
    // names only core and gallery, but its build compiles gallery's page, which is panel's, so
    // panel's alias is here too. lv keeps no vitest config of its own, so the test runner
    // reads this one too.
    alias: {
      core: resolve(__dirname, '../libraries/core/src/lib'),
      panel: resolve(__dirname, '../libraries/panel/src/lib'),
      gallery: resolve(__dirname, '../libraries/gallery/src'),
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Vite false positive: ?raw imports detected as both static and dynamic (vitejs/vite#12706)
        if (warning.message?.includes('dynamically imported') && warning.message?.includes('statically imported')) return;
        warn(warning);
      },
    },
  },
  server: {
    port: ports.lv.port,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: ports.lv.port,
    },
  },
  define: {
    __ASSETS_DIR__: JSON.stringify(resolve(process.cwd(), 'src/assets'))
  }
});
