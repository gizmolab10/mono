// Everything mj imports from gallery, in one file. Each line says where the thing really
// lives — through the "gallery" alias that tsconfig and vite.config both know. Only this
// file reaches through it; every other mj file imports here.
//
// gallery's switches come through too: Main.ts sets them to mj's own before it mounts.

export { customizations as gallery_customizations } from 'gallery/lib/ts/common/Customizations';
export { photosInFolder } from 'gallery/lib/ts/utilities/Loader';
export { technical } from 'gallery/lib/ts/utilities/Technical.svelte';
export { default as Gallery } from 'gallery/lib/svelte/Gallery.svelte';
export { default as Edit } from 'gallery/lib/svelte/Edit.svelte';
