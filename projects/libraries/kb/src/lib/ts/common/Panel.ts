// Everything kb imports from panel, in one file. Each line says where the thing really lives —
// through the "panel" alias that tsconfig and vitest.config both know. Only this file reaches
// through it; every other kb file imports here.

export { default as Panel } from 'panel/svelte/main/Panel.svelte';
