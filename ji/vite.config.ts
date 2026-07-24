import { svelte } from '@sveltejs/vite-plugin-svelte';
import ports from '../notes/tools/hub/ports.json';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
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
    port: ports.ji.port,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: ports.ji.port,
    },
  },
  define: {
    __ASSETS_DIR__: JSON.stringify(resolve(process.cwd(), 'src/assets'))
  }
});
