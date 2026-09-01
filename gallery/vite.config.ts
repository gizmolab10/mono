import { svelte } from '@sveltejs/vite-plugin-svelte';
import { photoTitles } from './plugins/photo-titles';
import { captionDrop } from './plugins/caption-drop';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte(), photoTitles(), captionDrop()],
  resolve: {
    // "core" is an alias for the shared library one folder over; tsconfig teaches
    // the checker the same alias, and the two must always agree. gallery keeps no
    // vitest config of its own, so the test runner reads this one too.
    alias: { core: resolve(__dirname, '../core/src/lib') },
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
  // No port of its own, by decision — gallery is not in the hub's ports file, so the dev
  // server takes whatever vite offers rather than naming a number nobody registered.
  define: {
    __ASSETS_DIR__: JSON.stringify(resolve(process.cwd(), 'src/assets'))
  }
});
