import { writable } from 'svelte/store';

// What the app is doing at the top level. It starts out setting up — the guides are
// being read — and nothing is shown until that finishes, so no part of the app ever
// has to draw itself against a structure that isn't there yet.
export enum S_App {
	launch = 'launch',
	ready  = 'ready',
}

export const w_app = writable<S_App>(S_App.launch);
