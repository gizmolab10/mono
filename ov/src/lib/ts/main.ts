import App from '../svelte/main/App.svelte';
import { guides } from './managers/Guides';
import { c } from './common/Configuration';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import { debug } from './common/Debug';
import { mount } from 'svelte';
import './utilities/Fonts';
import '../main.css';

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

// Read every guide file once, for its labels only. Started here and not waited on —
// the app shows itself right away and fills in the moment the reading finishes.
guides.load();

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;
