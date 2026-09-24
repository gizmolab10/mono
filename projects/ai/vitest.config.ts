import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// The test runner: anything ending in .test.ts under src, ov's shape.
export default defineConfig({
	plugins: [svelte()],
	resolve: {
		// "core", "panel" and "kb" are aliases for the three libraries in the libraries folder.
		// vite.config.ts and tsconfig.json each say the same thing; all three must always agree.
		alias: {
			core: resolve(dirname(fileURLToPath(import.meta.url)), '../libraries/core/src/lib'),
			panel: resolve(dirname(fileURLToPath(import.meta.url)), '../libraries/panel/src/lib'),
			kb: resolve(dirname(fileURLToPath(import.meta.url)), '../libraries/kb/src/lib'),
		},
	},
	test: {
		globals : true,
		include : ['src/**/*.{test,spec}.{ts,js}'],
		exclude : ['**/node_modules/**', '**/dist/**'],
	},
});
