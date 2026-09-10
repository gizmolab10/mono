// The stylesheets are the one thing that does not pass through Gallery.ts: they have no
// exports, and where they load decides which of two equal rules wins — so they come first,
// where lv's own stylesheet used to. The page shell's rules, then the gallery's own.
import 'gallery/css/Main.css';
import 'gallery/css/Gallery.css';
import App from '../svelte/App.svelte';
import { customizations } from './common/Customizations';
import { gallery_customizations } from './common/Gallery';
import { c, colors } from './common/Core';
import { mount } from 'svelte';

// From core's one source of sizes to the stylesheet: a plain css file
// cannot import a typescript module, so the numbers are pushed onto the page as
// style names once, before anything draws.
c.configure_layers();
c.configure_metrics();
c.configure_inks();

// lv's one color, for the accent and the page alike, so the regions and the space around them
// read as one. core starts both at its defaults and remembers nothing, so they are set here,
// before anything draws.
colors.w_accent_color.set(customizations.color);
colors.w_background_color.set(customizations.color);

// gallery draws lv, and reads lv's switches only when asked, so they are set here, before
// anything draws: what the controls row calls the site, which page is home, what every
// remembered value is saved under, and whether the sidebar may be drawn.
gallery_customizations.name = customizations.name;
gallery_customizations.home = customizations.home;
gallery_customizations.prefix = customizations.prefix;
gallery_customizations.enable_sidebar = customizations.enable_sidebar;

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;
