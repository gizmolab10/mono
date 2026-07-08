import '@fontsource/montserrat/300.css';
import '@fontsource/montserrat/400.css';
import App from '../svelte/main/App.svelte';
import { mount } from 'svelte';

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;
