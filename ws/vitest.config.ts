import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
	plugins: [svelte()],
	test: {
		environment: 'jsdom',
		globals: true,
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
		setupFiles: ['src/lib/ts/tests/setup.ts'],
	},
	resolve: {
		alias: {
			'$lib': path.resolve(__dirname, './src/lib'),
		},
	},
});

