import S_Element from '../../../src/lib/ts/state/S_Element';
import { writable } from 'svelte/store';

export default class UX_Hover {
	w_s_hover = writable<S_Element | null>();
}

export const hover = new UX_Hover();