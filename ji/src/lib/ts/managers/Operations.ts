import { preferences, T_Preference } from './Preferences'; 
import { writable, derived, get } from 'svelte/store';
import { debug } from '../common/Debug';

export enum T_Operation {
	chat  = 'chat history',
	drop  = 'add new document',
	files = 'browse files',
	init  = 'add LLM credentials',
	tags  = 'add new tag',
	view  = 'view document',
}

export const w_operation = preferences.persistent<T_Operation | null>(T_Preference.current_op, null);

// Which document the "view" operation is showing. Persisted, so a reload returns to
// the same open document; if that document is gone, the view falls back to the list.
export const w_view_document = preferences.persistent<string | null>(T_Preference.viewDocument, null);

// No operation means no open document — leaving every view drops what it pointed at.
w_operation.subscribe((op) => { if (op !== T_Operation.view) { w_view_document.set(null); } });

// --- stepping through the on-screen showable documents ---------------------------
//
// The viewer steps from one showable document to the next. The list owns the run
// (it applies the search and folds, then keeps only the showable rows) and keeps it
// here; the viewer, which now lives outside the list, reads it to step. A "stop" is a
// place, not just a document — a duplicate that shows twice is two stops — so each
// entry carries the row's place key.
export type View_Stop = { id: string; name: string; place_key: string };

export const w_viewable_run = writable<View_Stop[]>([]);
export const w_view_pos     = writable<number>(0);

// There is more than one stop to step between only when the run holds more than one.
export const w_can_step = derived(w_viewable_run, (run) => run.length > 1);

// Open the viewer on one stop, marking where it sits in the run so the triangles know
// where they are. Matched by place key so a duplicate opens at the exact row clicked.
export function open_view(stop: View_Stop): void {
	const run = get(w_viewable_run);
	const pos = run.findIndex((r) => r.place_key === stop.place_key);
	w_view_pos.set(pos < 0 ? 0 : pos);
	w_view_document.set(stop.id);
	w_operation.set(T_Operation.view);
	debug.log(`Viewing "${stop.name}" — stop ${(pos < 0 ? 0 : pos) + 1} of ${run.length} showable on screen.`);
}

// Step to the file before or after, wrapping at both ends. Nothing to do with one.
export function step_view(delta: number): void {
	const run = get(w_viewable_run);
	if (run.length < 2) { debug.log(`Step ignored — only ${run.length} showable file on screen.`); return; }
	const pos = (get(w_view_pos) + delta + run.length) % run.length;
	w_view_pos.set(pos);
	w_view_document.set(run[pos].id);
	debug.log(`Stepped ${delta > 0 ? 'forward' : 'back'} to "${run[pos].name}" — stop ${pos + 1} of ${run.length}.`);
}

// Close the viewer, back to the list.
export function close_view(): void {
	w_view_document.set(null);
	if (get(w_operation) === T_Operation.view) { w_operation.set(T_Operation.files); }
}
