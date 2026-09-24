// Run URL-flag handling before anything else imports preferences-backed state.
import './lib/ts/common/Configuration';
import './css/app.css';
import { mount } from 'svelte';
import App from './App.svelte';

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;
