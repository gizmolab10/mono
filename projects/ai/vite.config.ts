import { svelte } from '@sveltejs/vite-plugin-svelte';
import ports from '../../tools/hub/ports.json';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    // "core", "panel" and "kb" are aliases for the three libraries in the libraries folder; tsconfig
    // and vitest.config teach the checker and the test runner the same aliases, and the three
    // must always agree. panel's is carried for the build, since kb draws panel from step 5 of
    // the plan; no file of ai's names it.
    alias: {
      core: resolve(__dirname, '../libraries/core/src/lib'),
      panel: resolve(__dirname, '../libraries/panel/src/lib'),
      kb: resolve(__dirname, '../libraries/kb/src/lib'),
    },
  },
  server: {
    port: ports.ai.port,
    strictPort: true,
    // The page reads the memory files, which live at the top of the repo, two folders up since
    // ai moved under projects/ on 23 September 2026. Without this the dev server answers 403 for
    // every one of them and the page reads only what sits inside this folder.
    fs: { allow: [resolve(__dirname, '../..')] },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: ports.ai.port,
    },
  },
});
