import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import ports from '../notes/sites/ports.json';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: ports.di
  },
});
