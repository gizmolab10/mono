// Everything lv imports from gallery, in one file. Each line says where the thing really
// lives — through the "gallery" alias that tsconfig and vite.config both know. Only this
// file reaches through it for code, and Main.ts for the stylesheet alone; every other lv
// file imports here.
//
// gallery's switches come through too: Main.ts sets them to lv's own before it mounts.

export { customizations as gallery_customizations } from 'gallery/lib/ts/common/Customizations';
export { default as Main } from 'gallery/lib/svelte/Main.svelte';
