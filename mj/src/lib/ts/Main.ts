import App from '../svelte/App.svelte';
import { customizations } from './common/Customizations';
import { preferences, T_Preference } from './managers/Preferences';
import { gallery_customizations } from './common/Gallery';
import { c, colors } from './common/Core';
import { mount } from 'svelte';

// From core's one source of sizes to any stylesheet: a plain css file
// cannot import a typescript module, so the numbers are pushed onto the page as
// style names once, before anything draws.
c.configure_layers();
c.configure_metrics();
c.configure_inks();

// gallery draws mj's pictures, and reads mj's switches only when asked, so they are set
// here, before anything draws: which page is home, and what every remembered value is
// saved under.
gallery_customizations.home = customizations.home;
gallery_customizations.prefix = customizations.prefix;

// What the host owes core's colors: core starts the two chosen colors at defaults and
// remembers nothing, so each remembered choice is read in here, and every later change is
// written back where it was read from.
for (const [key, store] of [
	[T_Preference.color_background, colors.w_background_color],
	[T_Preference.color_accent,     colors.w_accent_color],
] as const) {
	const remembered = preferences.read<string>(key);
	if (remembered !== null) { store.set(remembered); }
	store.subscribe((color) => preferences.write(key, color));
}

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;

// The stylesheets are the one thing that does not pass through a bridge: they have no
// exports, and where they load decides which of two equal rules wins — so they come last.
// core's, then the gallery's own look for its pictures and its editing.
import 'core/main.css';
import 'gallery/css/Gallery.css';
