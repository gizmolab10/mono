import './utilities/Fonts';
import { mount } from 'svelte';
import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import '../main.css';
import { c } from './common/Configuration';
import App from '../svelte/main/App.svelte';

// Mirror the static layout numbers (stacking layers, gap, radius) onto the page
// before the app renders, so the stylesheets can read them from the first paint.
c.configure_layers();
c.configure_metrics();

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;
