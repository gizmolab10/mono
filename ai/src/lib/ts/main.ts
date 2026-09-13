import App from '../svelte/main/App.svelte';
import { files, kb_customizations, preferences, T_Preference, w_app, S_App, w_operation, w_view_file, T_Operation } from './common/Kb';
import { customizations } from './common/Customizations';
import { c, colors, debug } from './common/Core';
import buildsRaw from '../md/builds.md?raw';
import { get } from 'svelte/store';
import { mount } from 'svelte';
import 'core/main.css';

// kb draws ai, and reads ai's facts only when asked, so they are set here, before anything draws:
// what the controls row calls the host, what every remembered value is saved under, the host whose
// db the dispatcher answers from, the hierarchies the list offers, and the build notes table. The
// kinds, the tags and the tag areas are still kb's own until step 7 of the plan.
kb_customizations.name = customizations.name;
kb_customizations.prefix = customizations.prefix;
kb_customizations.host = customizations.host;
kb_customizations.hierarchies = customizations.hierarchies;
kb_customizations.builds = buildsRaw;

// The entry file: ov's main.ts, doing here what a library cannot, since a library has no entry
// file. The host pays what the libraries owe at startup, as libraries.md says. What is owed
// core's colors: core starts the three chosen colors at defaults and remembers nothing, so each
// remembered choice is read in here, and every later change is written back where it was read
// from.
for (const [key, store] of [
	[T_Preference.color_background, colors.w_background_color],
	[T_Preference.color_accent,     colors.w_accent_color],
	[T_Preference.color_text,       colors.w_text_color],
] as const) {
	const remembered = preferences.read<string>(key);
	if (remembered !== null) { store.set(remembered); }
	store.subscribe((color) => preferences.write(key, color));
}

// Mirror the static values (stacking layers, sizes, and the fixed ink colors)
// onto the page before anything renders, so the stylesheets read them from the
// first paint.
c.configure_layers();
c.configure_metrics();
c.configure_inks();

// Proof the numbers really landed on the page: read three of them back off the
// page itself rather than trusting that setting them worked.
const on_page = getComputedStyle(document.documentElement);
debug.log(`Startup: pushed the layer numbers, the sizes and the fixed inks onto the page. Reading three back — the gap between regions is "${on_page.getPropertyValue('--gap').trim()}", the region corner radius is "${on_page.getPropertyValue('--radius').trim()}", the ink black is "${on_page.getPropertyValue('--black').trim()}". Empty values would mean the push from the numbers to the stylesheets is broken.`);

// Every guide is hung on the structure from the dispatcher's listing, and the app shows itself
// the moment that is done — names and folders, no labels yet. The labels are read after, in
// this order: the file the editor is presenting, so its words are on screen first; then the
// rows the list has in view, counting from the row it was left scrolled to; then the rest.
const ROWS_IN_VIEW = 60;
files.load(() => {
	const first: string[] = [];
	const viewed = get(w_operation) === T_Operation.edit ? get(w_view_file) : null;
	if (viewed) { first.push(viewed); }
	const rows = get(files.w_showing);
	const top = preferences.read<string>(T_Preference.scroll_files_to);
	const at = Math.max(0, rows.findIndex((row) => row.key === top));
	for (const row of rows.slice(at, at + ROWS_IN_VIEW)) { if (!row.file.is_folder) { first.push(row.key); } }
	return first;
}).then(() => {
	w_app.set(S_App.ready);
	debug.log(`Startup: the files are listed and the app is showing itself; their labels are still coming in.`);
});

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;
