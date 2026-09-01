import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Core's own test runner. It has no host, so there is no alias to teach it: every
// import inside core is relative. Tests sit under ts/tests — anything ending in
// .test.ts under the source folder is picked up.
export default defineConfig({
	plugins: [svelte()],
	test: {
		globals : true,
		include : ['src/**/*.{test,spec}.{ts,js}'],
		exclude : ['**/node_modules/**', '**/dist/**'],
	},
});
