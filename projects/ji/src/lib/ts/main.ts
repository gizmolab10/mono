import App from '../svelte/main/App.svelte';
import { c } from './common/Configuration';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import { mount } from 'svelte';
import './utilities/Fonts';
import '../main.css';

// Mirror the static values (stacking layers, sizes, and the fixed ink colors)
// onto the page before the app renders, so the stylesheets read them from the
// first paint.
c.configure_layers();
c.configure_metrics();
c.configure_inks();

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;
