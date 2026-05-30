import '../../css/main.css';
import App from '../svelte/main/App.svelte';
import { mount } from 'svelte';

const app = mount(App, {
	target: document.getElementById('app')!,
});

export default app;
