import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// The test runner. Same shape as di's, minus the pieces overview has no use for:
// no setup file, no assets folder, no browser-driven tests. Tests sit beside the
// code they cover, or under a tests folder — anything ending in .test.ts under src.
export default defineConfig({
	plugins: [svelte()],
	test: {
		globals : true,
		include : ['src/**/*.{test,spec}.{ts,js}'],
		exclude : ['**/node_modules/**', '**/dist/**'],
	},
});
