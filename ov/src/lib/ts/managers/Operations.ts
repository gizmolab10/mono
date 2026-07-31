import { preferences, T_Preference } from './Preferences';
import { writable, derived, get } from 'svelte/store';
import { debug } from '../common/Debug';

/**
 * Operations — which of the two things the content box is doing.
 *
 * Ported from ji, trimmed to the two overview has: looking through the guides, and
 * reading one. ji's other five (chat, drop, files, tags, credentials) have nothing
 * to stand on here.
 */

export enum T_Operation {
	browse = 'browse the guides',
	view   = 'read one guide',
}

export const w_operation = preferences.persistent<T_Operation>(T_Preference.current_op, T_Operation.browse);

// Which guide is being read, named by where it sits. Remembered, so a reload comes back
// to the same one; if it is gone from the list, reading falls back to browsing.
export const w_view_guide = preferences.persistent<string | null>(T_Preference.view_guide, null);

// Leaving the reading view drops what it pointed at.
w_operation.subscribe((op) => { if (op !== T_Operation.view) { w_view_guide.set(null); } });

// --- stepping through the guides on screen ---------------------------------
//
// Reading steps from one guide to the next. The list owns the run — it applies the
// filters and the folds, then keeps only the files — and leaves it here; the reading
// view, which lives outside the list, reads this to step.
export type View_Stop = { key: string; name: string; address: string };

export const w_viewable_run = writable<View_Stop[]>([]);
export const w_view_pos     = writable<number>(0);

// There is somewhere to step only when the run holds more than one.
export const w_can_step = derived(w_viewable_run, (run) => run.length > 1);

/** Open one guide, marking where it sits in the run so the triangles know where they are. */
export function open_view(stop: View_Stop): void {
	const run = get(w_viewable_run);
	const at = run.findIndex((r) => r.key === stop.key);
	w_view_pos.set(at < 0 ? 0 : at);
	w_view_guide.set(stop.key);
	w_operation.set(T_Operation.view);
	debug.log(`Reading "${stop.name}" — stop ${(at < 0 ? 0 : at) + 1} of ${run.length} on screen.`);
}

/** Step to the guide before or after, wrapping at both ends. Nothing to do with one. */
export function step_view(by: number): void {
	const run = get(w_viewable_run);
	if (run.length < 2) { debug.log(`Step ignored — only ${run.length} guide on screen.`); return; }
	const at = (get(w_view_pos) + by + run.length) % run.length;
	w_view_pos.set(at);
	w_view_guide.set(run[at].key);
	debug.log(`Stepped ${by > 0 ? 'forward' : 'back'} to "${run[at].name}" — stop ${at + 1} of ${run.length}.`);
}

/** Close the reading view, back to the list. */
export function close_view(): void {
	w_view_guide.set(null);
	if (get(w_operation) === T_Operation.view) { w_operation.set(T_Operation.browse); }
}
