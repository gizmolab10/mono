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
export { show_status } from 'kb/ts/managers/Status';
export { file_path_of, save_file } from 'kb/ts/utilities/Saving';
export { title_from_name } from 'kb/ts/utilities/Labels';
export type { File, Labels } from 'kb/ts/types/File';
export type { Source } from 'kb/ts/utilities/Saving';
export { read_file, path_of_address } from 'kb/ts/utilities/Saving';
export { follow_link, halt_stepping, leaving_file, left_at_of, w_command_down } from 'kb/ts/managers/Operations';
export { offer_status } from 'kb/ts/managers/Status';
export { key_of } from 'kb/ts/types/File';
export { labels_for, today } from 'kb/ts/utilities/Labels';
export { code_link_of, is_code_link } from 'kb/ts/utilities/Opening_Code';
export { body_of, links_in, plain_links } from 'kb/ts/utilities/Links';
export type { Link_In_Words } from 'kb/ts/utilities/Links';
