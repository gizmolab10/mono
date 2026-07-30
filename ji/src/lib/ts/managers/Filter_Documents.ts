import { T_DocumentFamily } from '../types/Document';
import { preferences, T_Preference } from './Preferences';
import { writable } from 'svelte/store';
import { debug } from '../common/Debug';

// One source of truth for narrowing the documents list: which tags are picked
// and what filter text is typed. Views bind these; the filter function below
// keeps the two rules in one place.

// Whether a document must carry ALL the picked tags or just ANY of them.
export type T_Match = 'all' | 'any';

// The four filters: the picked tags, whether a row must carry all of them or any,
// the typed name text, and the picked families (empty means no family filter).
// Each is saved across reloads, and saved per storage — "mine" and "AI" keep their
// own picks, since the same tag names and files don't live in both. Switching
// storages puts away what's on screen and brings out that storage's own filters.
export const w_filter_tags     = writable<Set<string>>(new Set());
export const w_filter_text     = writable<string>('');
export const w_filter_mode     = writable<T_Match>('all');
export const w_filter_families = writable<string[]>([]);

// Which storage the four stores are currently holding filters for. Null until the
// first load, so the stores' own start-up notifications can't write empty filters
// over anything saved, and so a load can't write the incoming filters back into
// the storage just left.
let filters_for: string | null = null;

function save_filter<T>(key: T_Preference, value: T): void {
	if (filters_for === null) { return; }
	preferences.write_forStorage(filters_for, key, value);
}

w_filter_tags.subscribe((s)     => save_filter(T_Preference.filter_tags, Array.from(s)));
w_filter_text.subscribe((t)     => save_filter(T_Preference.filter_text, t));
w_filter_mode.subscribe((m)     => save_filter(T_Preference.filter_mode, m));
w_filter_families.subscribe((f) => save_filter(T_Preference.format_families, f));

// Bring out one storage's saved filters. Called on launch and on every switch; the
// hold-off above keeps these four writes from being saved as the previous storage's.
export function load_filters_forStorage(storage: string): void {
	filters_for = null;
	const tags     = preferences.read_forStorage<string[]>(storage, T_Preference.filter_tags) ?? [];
	const text     = preferences.read_forStorage<string>(storage, T_Preference.filter_text) ?? '';
	const mode     = preferences.read_forStorage<T_Match>(storage, T_Preference.filter_mode) ?? 'all';
	const families = preferences.read_forStorage<string[]>(storage, T_Preference.format_families) ?? [];
	w_filter_tags.set(new Set(tags));
	w_filter_text.set(text);
	w_filter_mode.set(mode);
	w_filter_families.set(families);
	filters_for = storage;
	debug.log(`Filters for the "${storage}" storage: ${tags.length} tag(s) [${mode}], name text "${text}", families [${families.join(', ')}]. Saved changes from here on go to "${storage}" only.`);
}

// Anything the filter can judge: a display name, the tag ids it carries, and its
// family (so the family filter can act, and so folders can be told apart).
export interface Filterable {
	name    : string;
	tag_ids : string[];
	family? : string | null;
}

// The content rows that clear the picked tags (all vs any), the name text, and the
// picked families. Folders are structure, not content: they never match on their
// own — the caller brings a folder back only as a parent of a surviving row, so a
// folder with nothing left under it drops. When nothing is picked, everything shows
// (folders included), so the plain list is untouched.
export function filter_rows<T extends Filterable>(rows: T[], tag_ids: Set<string>, text: string, mode: T_Match, families: string[]): T[] {
	const wanted = Array.from(tag_ids);
	const needle = text.trim().toLowerCase();
	const any_filter = wanted.length > 0 || needle !== '' || families.length > 0;
	if (!any_filter) {
		debug.log(`Search: nothing picked — all ${rows.length} row(s) shown.`);
		return rows.slice();
	}
	const tag_ok    = (row: T) => wanted.length === 0
		|| (mode === 'all' ? wanted.every((id) => row.tag_ids.includes(id))
		                   : wanted.some((id) => row.tag_ids.includes(id)));
	const text_ok   = (row: T) => needle === '' || row.name.toLowerCase().includes(needle);
	const family_ok = (row: T) => families.length === 0 || families.includes(row.family ?? '');
	// Drop folders here; the caller re-adds the ones that still hold a surviving row.
	const kept = rows.filter((row) => row.family !== T_DocumentFamily.folder && tag_ok(row) && text_ok(row) && family_ok(row));
	debug.log(`Search: ${wanted.length} tag(s) [${mode}] + text "${needle}" + ${families.length} family(ies) [${families.join(', ')}] kept ${kept.length} content row(s) of ${rows.length}.`);
	return kept;
}
