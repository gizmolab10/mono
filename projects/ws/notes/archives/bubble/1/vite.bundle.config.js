import { visualizer } from 'rollup-plugin-visualizer';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		[svelte()],
		visualizer({
			filename: './dist/stats.html',
			open: false,					// Do not automatically open the file in your browser
		}),
	],
	build: {
		sourcemap: true,					// Generate detailed source maps
		minify: 'esbuild',					// Ensure esbuild is used for minification
		lib: {
			entry: './src/lib/js/main.js',	// Entry point for your app
			name: 'WebSeriouslyBundle',		// Global name for the library
			formats: ['iife'],    		  	// Use "iife" for browser-friendly bundles
			fileName: 'webseriously', 		// Output file name (webseriously.iife.js)
		},
		rollupOptions: {
			external: [],					// Do not exclude the `svelte` runtime
			output: {
				exports: 'named',
				sourcemap: 'inline',		// Inline source maps for easier debugging
				globals: {
					svelte: 'Svelte',		// Ensure all dependencies are included in the bundle
					'svelte/internal': 'svelteInternal', // Ensure proper bundling
				},
			},
		},
	},
});
