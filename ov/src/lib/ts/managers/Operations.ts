import { preferences, T_Preference } from './Preferences';
import type { Filtered_Guide } from '../types/Guide';
import { derived, get, writable } from 'svelte/store';
import { guides } from './Guides';
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
	report = 'read a long report',
}

export const w_operation = preferences.persistent<T_Operation>(T_Preference.current_op, T_Operation.browse);

// Which guide is being read, named by where it sits. Remembered, so a reload comes back
// to the same one; if it is gone from the list, reading falls back to browsing.
export const w_view_guide = preferences.persistent<string | null>(T_Preference.view_guide, null);

// Leaving the reading view drops what it pointed at.
w_operation.subscribe((op) => { if (op !== T_Operation.view) { w_view_guide.set(null); } });

// --- stepping through the guides on screen ---------------------------------
//
// Reading steps through the very same rows the list draws — what the filters and the
// folds leave, folders included. Folders are not stops, so stepping walks past any it
// meets. Nothing is sifted on the way in.

// --- the guides reached by following links ---------------------------------
//
// Following a link puts the guide it names on a stack of its own, which starts empty
// each time reading begins from the list. While the stack holds anything, the two
// triangles walk it instead of the list: back goes one down, forward one up. Backing
// out past the bottom empties the stack and hands the triangles back to the list.

export const w_link_stack = writable<string[]>([]);
export const w_stack_at   = writable<number>(-1);

// Where the reading began — the guide the list opened. Backing out of the bottom of the
// stack lands here. A page refresh forgets it, along with the stack.
export const w_anchor = writable<string | null>(null);

/** The row being read right now — from the list if it is there, otherwise from all of them. */
export const w_viewed = derived([guides.w_showing, w_view_guide], ([rows, key]) =>
	rows.find((r) => r.key === key)
	?? (key === null ? null : guides.hierarchy.all_guides.get(key) ?? null));

/** Is there a guide behind this one — the one below on the stack, or a place in the list? */
export const w_can_back = derived([guides.w_showing, w_link_stack], ([rows, stack]) =>
	stack.length > 0 || rows.filter((r) => !r.guide.is_folder).length > 1);

/** Forward means the guide above on the stack; off the stack, it walks the list. */
export const w_can_forward = derived([guides.w_showing, w_link_stack, w_stack_at], ([rows, stack, at]) =>
	stack.length > 0
		? at < stack.length - 1
		: rows.filter((r) => !r.guide.is_folder).length > 1);

// Is the guide on screen open for editing? Kept out here rather than inside the reading
// view, so the list can open a guide straight into editing — holding the command key while
// clicking a file does exactly that.
export const w_editing = writable(false);

// Is the command key held down right now? Watched at the app root. Clicking a guide with it
// held opens that guide already editing, so the hover words say so while it is down.
export const w_command_down = writable(false);

// Is the option key held down too? Command with option hands a guide to Obsidian rather than
// opening it here, so the hover words have to know about both.
export const w_option_down = writable(false);

// Words to look for the moment a guide opens, so a dead link picked out of a report is lit
// as soon as its guide is drawn. Emptied by the guide that uses it.
export const w_search_for = writable('');

/** Open one guide by where it sits. Opening from the list starts a fresh, empty stack. */
export function open_view(key: string, for_editing = false): void {
	const rows = get(guides.w_showing);
	// Off the list first; failing that, among all of them — a guide the filters hide can still
	// be opened when something else names it, such as a report of dead links.
	const row = rows.find((r) => r.key === key) ?? guides.hierarchy.all_guides.get(key) ?? null;
	if (!row || row.guide.is_folder) { debug.log(`Reading: nothing to open at "${key}".`); return; }
	w_editing.set(for_editing);
	w_link_stack.set([]);
	w_stack_at.set(-1);
	w_anchor.set(key);
	w_view_guide.set(key);
	w_operation.set(T_Operation.view);
	const files = rows.filter((r) => !r.guide.is_folder).length;
	debug.log(`Reading "${row.guide.name}"${for_editing ? ', straight into editing' : ''} — ${files} guide(s) on screen to step through, among ${rows.length} rows. The link stack starts empty.`);
}

/**
 * Show a guide reached by following a link. Already on the stack: back up to it, leaving
 * what is above still there to go forward to. Otherwise the guides above where you stand
 * are dropped and this one goes on top — so the stack is always the path you actually took,
 * which is what keeps a guide from being on it twice.
 */
export function follow_link(key: string): void {
	const row = guides.hierarchy.all_guides.get(key);
	if (!row || row.guide.is_folder) { debug.log(`Following a link: nothing to open at "${key}".`); return; }
	const stack = get(w_link_stack);
	const already = stack.indexOf(key);
	if (already >= 0) {
		w_stack_at.set(already);
		debug.log(`Following a link to "${row.guide.name}": already number ${already + 1} of ${stack.length} on the stack, so backing up to it — ${stack.length - already - 1} guide(s) still ahead.`);
	} else {
		const at = get(w_stack_at);
		const kept = stack.slice(0, at + 1);
		const dropped = stack.length - kept.length;
		const next = [...kept, key];
		w_link_stack.set(next);
		w_stack_at.set(next.length - 1);
		debug.log(`Following a link to "${row.guide.name}": pushed as number ${next.length} of ${next.length}${dropped > 0 ? `, dropping ${dropped} guide(s) that were ahead` : ''}.`);
	}
	w_view_guide.set(key);
	w_operation.set(T_Operation.view);
}

/**
 * Step before or after. While the link stack holds anything it is what gets walked; the
 * list is walked only once the stack is empty.
 */
export function step_view(by: number): void {
	const stack = get(w_link_stack);
	if (stack.length > 0) { step_stack(by); return; }
	step_list(by);
}

/** Walk the stack of guides reached by links. Backing out of the bottom empties it. */
function step_stack(by: number): void {
	const stack = get(w_link_stack);
	const at = get(w_stack_at);
	const to = at + (by > 0 ? 1 : -1);
	if (to >= stack.length) { debug.log(`Forward ignored — already at the top of the stack, ${stack.length} guide(s) deep.`); return; }
	if (to < 0) {
		const home = get(w_anchor);
		w_link_stack.set([]);
		w_stack_at.set(-1);
		if (home) { w_view_guide.set(home); }
		debug.log(`Backed out past the bottom of the stack — ${stack.length} visit(s) forgotten, back to "${home ?? 'nothing'}" and the list's own stepping.`);
		return;
	}
	w_stack_at.set(to);
	w_view_guide.set(stack[to]);
	const row = guides.hierarchy.all_guides.get(stack[to]);
	debug.log(`Stepped ${by > 0 ? 'forward' : 'back'} on the stack, from number ${at + 1} to ${to + 1} of ${stack.length} — now reading "${row?.guide.name ?? stack[to]}".`);
}

/**
 * Step to the guide before or after in the list, walking past folders and wrapping at
 * both ends. Nothing to do when there is one file or none.
 */
function step_list(by: number): void {
	const rows = get(guides.w_showing);
	const files = rows.filter((r) => !r.guide.is_folder);
	if (files.length < 2) { debug.log(`Step ignored — ${files.length} guide(s) on screen.`); return; }
	const key = get(w_view_guide);
	let at = rows.findIndex((r) => r.key === key);
	if (at < 0) { at = 0; }
	let skipped = 0;
	let to = at;
	// Walk one row at a time in the asked-for direction until a file turns up.
	for (let tried = 0; tried < rows.length; tried++) {
		to = ((to + by) % rows.length + rows.length) % rows.length;
		if (!rows[to].guide.is_folder) { break; }
		skipped += 1;
	}
	w_view_guide.set(rows[to].key);
	w_anchor.set(rows[to].key);
	debug.log(`Stepped ${by > 0 ? 'forward' : 'back'} from row ${at} to row ${to} of ${rows.length}, walking past ${skipped} folder(s) — now reading "${rows[to].guide.name}".`);
}

/** Close the reading view, back to the list. The stack ends with the reading. */
export function close_view(): void {
	w_editing.set(false);          // editing belongs to the guide that was open, not the next one
	w_view_guide.set(null);
	w_link_stack.set([]);
	w_stack_at.set(-1);
	if (get(w_operation) === T_Operation.view) { w_operation.set(T_Operation.browse); }
}

export type { Filtered_Guide };
