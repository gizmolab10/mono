// Everything ai imports from kb, in one file. Each line says where the thing really lives —
// through the "kb" alias that tsconfig, vite.config and vitest.config all know. Only this file
// reaches through it; every other ai file imports here.

export { default as Main } from 'kb/svelte/main/Main.svelte';
export { customizations as kb_customizations } from 'kb/ts/common/Customizations';
export { files } from 'kb/ts/managers/Files';
export { preferences, T_Preference } from 'kb/ts/managers/Preferences';
export { w_operation, w_view_file, T_Operation } from 'kb/ts/managers/Operations';
export { w_app, S_App } from 'kb/ts/types/App';
export { area_of, area_reads, tags_shown, tags_without_area } from 'kb/ts/types/Tag_Areas';
