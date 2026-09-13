import { svelte } from '@sveltejs/vite-plugin-svelte';
import ports from '../tools/hub/ports.json';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    // "core", "panel" and "kb" are aliases for the three libraries one folder over; tsconfig
    // and vitest.config teach the checker and the test runner the same aliases, and the three
    // must always agree. panel's is carried for the build, since kb draws panel from step 5 of
    // the plan; no file of ai's names it.
    alias: {
      core: resolve(__dirname, '../core/src/lib'),
      panel: resolve(__dirname, '../panel/src/lib'),
      kb: resolve(__dirname, '../kb/src/lib'),
    },
  },
  server: {
    port: ports.ai.port,
    strictPort: true,
    // The page reads the memory files, which live outside this folder, one level up. Without
    // this the dev server refuses to serve them.
    fs: { allow: ['..'] },
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: ports.ai.port,
    },
  },
});
