import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// The test runner. Same structure as di's, minus the pieces overview has no use for:
// no setup file, no assets folder, no browser-driven tests. Tests sit beside the
// code they cover, or under a tests folder — anything ending in .test.ts under src.
export default defineConfig({
	plugins: [svelte()],
	resolve: {
		// "core" is an alias for the shared library one folder over. vite.config.ts and
		// tsconfig.json each say the same thing; all three must always agree.
		alias: { core: resolve(dirname(fileURLToPath(import.meta.url)), '../core/src/lib') },
	},
	test: {
		globals : true,
		include : ['src/**/*.{test,spec}.{ts,js}'],
		exclude : ['**/node_modules/**', '**/dist/**'],
	},
});
