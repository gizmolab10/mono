import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// The test runner. ov's, brought over whole at step 4 of the plan: no setup file, no assets
// folder, no browser-driven tests. Tests sit under the tests folder — anything ending in
// .test.ts under src.
export default defineConfig({
	plugins: [svelte()],
	resolve: {
		// "core" is an alias for the shared library one folder over. tsconfig.json says the
		// same thing, and the two must always agree. kb keeps no vite config, since a library
		// never runs alone: a host's build compiles it through the host's own alias.
		alias: { core: resolve(dirname(fileURLToPath(import.meta.url)), '../core/src/lib') },
	},
	test: {
		globals : true,
		include : ['src/**/*.{test,spec}.{ts,js}'],
		exclude : ['**/node_modules/**', '**/dist/**'],
	},
});
