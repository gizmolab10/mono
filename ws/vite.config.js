import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import ports from '../notes/tools/hub/ports.json';
import path from 'path';

// Detect whether we're building the plugin or the Svelte app
const isPluginBuild = process.env.BUILD_TARGET === 'plugin';

export default defineConfig({
	plugins: isPluginBuild ? [] : [svelte()],
	define: {
		global: 'globalThis'
	},
	server: {
		host: true,
		port: ports.ws,
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@import "./src/styles/variables.scss";`,
			},
		},
	},
	build: isPluginBuild
		? {
			lib: {
				entry: path.resolve(__dirname, 'plugin/initialize.ts'),
				name: 'BubblePlugin',
				fileName: 'bubble-plugin',
				formats: ['es'],
			},
			outDir: 'dist/plugin',
			sourcemap: true,
			rollupOptions: {
				output: {
					entryFileNames: 'bubble-plugin.js',
				},
			},
			emptyOutDir: false,
		}
		: {
			sourcemap: true,
			minify: false,
			rollupOptions: {
				output: {
					entryFileNames: 'assets/[name].js',
					chunkFileNames: 'assets/[name].js',
					assetFileNames: 'assets/[name].[ext]',
				},
				external: [/\/aside\//, /\/docs\//, /\/bubble\//],
			},
		},
});
