import App from '../svelte/main/App.svelte';
import { w_app, S_App } from './types/App';
import { files } from './managers/Files';
import { c } from './common/Core';
import { debug } from './common/Debug';
import { preferences, T_Preference } from './managers/Preferences';
import { colors } from './common/Core';
import { mount } from 'svelte';
import '../main.css';

// What the host owes core's colors: core starts the three chosen colors at defaults and
// remembers nothing, so each remembered choice is read in here, and every later change is
// written back where it was read from.
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
debug.log(`Startup: pushed the layer numbers, the sizes and the fixed inks onto the page. Reading three back — the gap between regions is "${on_page.getPropertyValue('--gap').trim()}", the region corner radius is "${on_page.getPropertyValue('--radius').trim()}", the ink black is "${on_page.getPropertyValue('--black').trim()}". Empty values would mean the bridge from the numbers to the stylesheets is broken.`);

// Read every guide file once, for its labels only. Nothing but the setting-up words
// shows until this finishes, so no part of the app ever draws itself against a
// structure that isn't there yet.
files.load().then(() => {
	w_app.set(S_App.ready);
	debug.log(`Startup: the guides are read and the app is showing itself.`);
});

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;
