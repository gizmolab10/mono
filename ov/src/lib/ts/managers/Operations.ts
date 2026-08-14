import { preferences, T_Preference } from './Preferences';
import type { Filtered_File } from '../types/File';
import { derived, get, writable } from 'svelte/store';
import { guides } from './Files';
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
	edit   = 'edit one guide',
	report = 'read a long report',
}

export const w_operation = preferences.persistent<T_Operation>(T_Preference.current_op, T_Operation.browse);

// Which guide is being read, named by where it sits. Remembered, so a reload comes back
// to the same one; if it is gone from the list, reading falls back to browsing.
export const w_view_guide = preferences.persistent<string | null>(T_Preference.view_guide, null);

// Leaving the reading view drops what it pointed at.
w_operation.subscribe((op) => { if (op !== T_Operation.edit) { w_view_guide.set(null); } });

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

// A guide is named by where it sits, so renaming or moving one leaves anything reading it
// asking for a place that no longer holds anything — and the view shuts itself. Following the
// move keeps it open on the very file it was already showing.
guides.moved_to = (was, now) => {
	if (get(w_view_guide) === was) { w_view_guide.set(now); }
	if (get(w_anchor) === was)     { w_anchor.set(now); }
	w_link_stack.update((stack) => stack.map((one) => (one === was ? now : one)));
	debug.log(`Reading: the guide being read moved from "${was}" to "${now}", so the view followed it rather than shutting.`);
};

/** The row being read right now — from the list if it is there, otherwise from all of them. */
export const w_viewed = derived([guides.w_showing, w_view_guide], ([rows, key]) =>
	rows.find((r) => r.key === key)
	?? (key === null ? null : guides.hierarchy.all_guides.get(key) ?? null));

// Reading that began in a report. Backing up then goes to the report rather than stepping the
// list, since a report is where the reader was and the list is not.
export const w_from_report = writable(false);

/** Is there a guide behind this one — the report it was opened from, the one below on the stack, or a place in the list? */
export const w_can_back = derived([guides.w_showing, w_link_stack, w_from_report], ([rows, stack, from_report]) =>
	from_report || stack.length > 0 || rows.filter((r) => !r.file.is_folder).length > 1);

/** Forward means the guide above on the stack; off the stack, it walks the list. */
export const w_can_forward = derived([guides.w_showing, w_link_stack, w_stack_at], ([rows, stack, at]) =>
	stack.length > 0
		? at < stack.length - 1
		: rows.filter((r) => !r.file.is_folder).length > 1);

// Is the command key held down right now? Watched at the app root. Clicking a file with it
// held hands that file to Obsidian rather than opening it here, so the hover words say so
// while it is down.
export const w_command_down = writable(false);

// Is the option key held down too? Command with option hands a guide to Obsidian rather than
// opening it here, so the hover words have to know about both.
export const w_option_down = writable(false);

// Words to look for the moment a guide opens, so a dead link picked out of a report is lit
// as soon as its guide is drawn. Emptied by the guide that uses it.
export const w_search_for = writable('');

// Which place the words turn up in is lit right now, counting from zero. The words themselves
// are the very ones typed into the list's own search field — one value for both screens, held
// with the filters. Kept here so leaving a guide, stepping to the next, or reloading all come
// back to the same place.
export const w_search_at = preferences.persistent<number>(T_Preference.search_at, 0);

/**
 * Which of the files on screen is being read, and how many there are — counting only files,
 * since the stepping walks past folders. Nothing while the guide being read is not among them,
 * as happens off the list, on a stack of links.
 */
export const w_file_site = derived([guides.w_showing, w_view_guide], ([rows, key]) => {
	const files = rows.filter((r) => !r.file.is_folder);
	const at = files.findIndex((r) => r.key === key);
	return at < 0 ? null : { at: at + 1, of: files.length };
});

/** Open one guide by where it sits. Opening from the list starts a fresh, empty stack. */
export function open_view(key: string): void {
	const rows = get(guides.w_showing);
	// Off the list first; failing that, among all of them — a guide the filters hide can still
	// be opened when something else names it, such as a report of dead links.
	const row = rows.find((r) => r.key === key) ?? guides.hierarchy.all_guides.get(key) ?? null;
	if (!row || row.file.is_folder) { debug.log(`Reading: nothing to open at "${key}".`); return; }
	w_link_stack.set([]);
	w_stack_at.set(-1);
	w_anchor.set(key);
	w_view_guide.set(key);
	w_from_report.set(false);
	w_operation.set(T_Operation.edit);
	w_stepping_halted.set(false);              // opening from the list is a fresh start
	const files = rows.filter((r) => !r.file.is_folder);
	const at = files.findIndex((r) => r.key === key);
	debug.log(`Opened "${row.file.name}" — file ${at + 1} of ${files.length} on screen, among ${rows.length} rows${at < 0 ? '; it is not among them, so the count shows nothing' : ''}. The link stack starts empty.`);
}

/**
 * Open one file picked out of a report. The same as opening it off the list, but the report is
 * remembered as where the reading began — so the back mark is drawn whatever the list holds, and
 * pressing it goes back to what was found rather than stepping to another file.
 */
export function open_from_report(key: string): void {
	open_view(key);
	if (get(w_operation) === T_Operation.edit) { w_from_report.set(true); }
}

/**
 * Show a guide reached by following a link. Already on the stack: back up to it, leaving
 * what is above still there to go forward to. Otherwise the guides above where you stand
 * are dropped and this one goes on top — so the stack is always the path you actually took,
 * which is what keeps a guide from being on it twice.
 */
export function follow_link(key: string): void {
	const row = guides.hierarchy.all_guides.get(key);
	if (!row || row.file.is_folder) { debug.log(`Following a link: nothing to open at "${key}".`); return; }
	// Which file the reading began at is forgotten by a reload, while the file being read is
	// remembered — so a link followed after a reload had nowhere to back out to, and the mark did
	// nothing at all. The file standing on screen when the stack starts is where it began.
	if (get(w_anchor) === null) {
		const here = get(w_view_guide);
		w_anchor.set(here);
		debug.log(`Following a link: nothing said where this reading began — a reload forgets it — so "${here ?? 'nothing'}", the file on screen, is taken as the beginning.`);
	}
	const stack = get(w_link_stack);
	const already = stack.indexOf(key);
	if (already >= 0) {
		w_stack_at.set(already);
		debug.log(`Following a link to "${row.file.name}": already number ${already + 1} of ${stack.length} on the stack, so backing up to it — ${stack.length - already - 1} guide(s) still ahead.`);
	} else {
		const at = get(w_stack_at);
		const kept = stack.slice(0, at + 1);
		const dropped = stack.length - kept.length;
		const next = [...kept, key];
		w_link_stack.set(next);
		w_stack_at.set(next.length - 1);
		debug.log(`Following a link to "${row.file.name}": pushed as number ${next.length} of ${next.length}${dropped > 0 ? `, dropping ${dropped} guide(s) that were ahead` : ''}.`);
	}
	w_view_guide.set(key);
	w_operation.set(T_Operation.edit);
}

/**
 * Step before or after. While the link stack holds anything it is what gets walked; the
 * list is walked only once the stack is empty.
 */
/**
 * Has the file on screen something that wants looking at — an offer to put it right, or words
 * that could not be read? Holding a step mark, or holding an arrow key, walks past a file in a
 * moment, so a file that raised something stops the walk there. One more press goes on.
 */
export const w_stepping_halted = writable(false);

/** Said by whatever read the file: it raised something, so the walk stops here. */
export function halt_stepping(why: string): void {
	w_stepping_halted.set(true);
	debug.log(`Stepping: held at this file — ${why}. Another press goes on.`);
}

export function step_view(by: number, repeated = false): void {
	debug.log(`Stepping ${by > 0 ? 'forward' : 'back'}${repeated ? ' (held down)' : ''}: the stack holds ${get(w_link_stack).length}, standing at ${get(w_stack_at)}, where the reading began ${get(w_from_report) ? 'in a report' : 'on the list'}, and the walk is ${get(w_stepping_halted) ? 'held' : 'free'}.`);
	if (repeated && get(w_stepping_halted)) { return; }
	w_stepping_halted.set(false);              // a press of its own always goes
	const stack = get(w_link_stack);
	// Back, from a file opened out of a report and with no links followed since, is the report
	// itself. Forward from there steps the list, the same as any other reading.
	if (by < 0 && stack.length === 0 && get(w_from_report)) { back_to_report(); return; }
	if (stack.length > 0) { step_stack(by); return; }
	step_list(by);
}

/** Back to what the report found. Whatever it holds is still there — nothing cleared it. */
function back_to_report(): void {
	w_from_report.set(false);
	w_operation.set(T_Operation.report);
	debug.log('Backed out of a file opened from a report — the report is on screen again.');
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
		// Where the marks go back to depends on where the reading began: a report, or the list.
		debug.log(`Backed out past the bottom of the stack — ${stack.length} visit(s) forgotten, back to "${home ?? 'nothing, so nothing moved'}" and ${get(w_from_report) ? 'the report it was opened from' : 'the list\'s own stepping'}.`);
		return;
	}
	w_stack_at.set(to);
	w_view_guide.set(stack[to]);
	const row = guides.hierarchy.all_guides.get(stack[to]);
	debug.log(`Stepped ${by > 0 ? 'forward' : 'back'} on the stack, from number ${at + 1} to ${to + 1} of ${stack.length} — now reading "${row?.file.name ?? stack[to]}".`);
}

/**
 * Step to the guide before or after in the list, walking past folders and wrapping at
 * both ends. Nothing to do when there is one file or none.
 */
function step_list(by: number): void {
	const rows = get(guides.w_showing);
	const files = rows.filter((r) => !r.file.is_folder);
	if (files.length < 2) { debug.log(`Step ignored — ${files.length} guide(s) on screen.`); return; }
	const key = get(w_view_guide);
	let at = rows.findIndex((r) => r.key === key);
	if (at < 0) { at = 0; }
	let skipped = 0;
	let to = at;
	// Walk one row at a time in the asked-for direction until a file turns up.
	for (let tried = 0; tried < rows.length; tried++) {
		to = ((to + by) % rows.length + rows.length) % rows.length;
		if (!rows[to].file.is_folder) { break; }
		skipped += 1;
	}
	w_view_guide.set(rows[to].key);
	w_anchor.set(rows[to].key);
	debug.log(`Stepped ${by > 0 ? 'forward' : 'back'} from row ${at} to row ${to} of ${rows.length}, walking past ${skipped} folder(s) — now reading "${rows[to].file.name}".`);
}

/** Close the reading view, back to the list. The stack ends with the reading. */
export function close_view(): void {
	w_view_guide.set(null);
	w_link_stack.set([]);
	w_stack_at.set(-1);
	w_from_report.set(false);
	if (get(w_operation) === T_Operation.edit) { w_operation.set(T_Operation.browse); }
}

export type { Filtered_File };
