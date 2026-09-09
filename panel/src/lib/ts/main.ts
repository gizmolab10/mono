import App from '../svelte/main/App.svelte';
import { c } from './common/Core';
import { mount } from 'svelte';

// From core's one source of sizes to any stylesheet: a plain css file
// cannot import a typescript module, so the numbers are pushed onto the page as
// style names once, before anything draws.
c.configure_layers();
c.configure_metrics();
c.configure_inks();

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;

// The stylesheet is the one adoption that does not pass through Core.ts: it has no
// exports, and where it loads decides which of two equal rules wins — so it comes last.
import 'core/main.css';
