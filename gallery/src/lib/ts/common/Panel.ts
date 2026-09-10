// Everything gallery imports from panel, in one file. Each line says where the thing really
// lives — through the "panel" alias that tsconfig and vite.config both know. Only this file
// reaches through it; every other gallery file imports here.

export { default as Panel } from 'panel/svelte/main/Panel.svelte';
