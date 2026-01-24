import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import svelte from 'rollup-plugin-svelte';
import { defineConfig } from 'rollup';
import swc from '@rollup/plugin-swc';

export default defineConfig({
	input: 'src/lib/js/index.js', // Entry point of your app
	output: {
		file: 'rollup/webseriously.bundle.js', // Output file
		format: 'iife', // Format: 'iife' for browsers, 'esm' for ES modules, etc.
		name: 'WebSeriously', // Global variable name for the IIFE
		sourcemap: true, // Optional: Generate source maps
	},
	plugins: [
		typescript(), // Add TypeScript plugin
		commonjs(), // Converts CommonJS modules to ES modules
		svelte({
			// Enable runtime CSS injection
			emitCss: false,
		}),
		resolve({
			browser: true, // Resolves browser-compatible modules
			dedupe: ['svelte'],
		}),
		swc({
			jsc: {
				target: 'es2017', // Transpile output to ES2017
				parser: {
					syntax: 'typescript',
					tsx: true,
					jsx: true,
				},
			},
		}),
	],
});
