/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import ports from '../notes/tools/hub/ports.json';

export default defineConfig({
	plugins: [svelte()],
	server: {
		port: ports.s3.port
	},
	test: {
		environment: 'node',
	},
});
