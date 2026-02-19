import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import ports from '../notes/tools/hub/ports.json';

function parseBuildNotes() {
  const md = readFileSync('src/lib/md/builds.md', 'utf-8');
  const lines = md.split('\n').filter(l => l.match(/^\|\s*\d+/));
  return lines.map(line => {
    const [_, build, date, note] = line.split('|').map(s => s.trim());
    return { build: parseInt(build), date, note };
  });
}

const buildNotes = parseBuildNotes();
const buildNumber = Math.max(...buildNotes.map(n => n.build));

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: ports.di.port
  },
  define: {
    __BUILD_NOTES__: JSON.stringify(buildNotes),
    __BUILD_NUMBER__: buildNumber,
    __ASSETS_DIR__: JSON.stringify(resolve(process.cwd(), 'src/assets'))
  }
});
