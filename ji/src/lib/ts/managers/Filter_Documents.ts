import { T_DocumentFamily } from '../types/Document';
import { preferences, T_Preference } from './Preferences';
import { writable } from 'svelte/store';
import { debug } from '../common/Debug';

// One source of truth for narrowing the documents list: which tags are picked
// and what filter text is typed. Views bind these; the filter function below
// keeps the two rules in one place.

// Whether a document must carry ALL the picked tags or just ANY of them.
export type T_Match = 'all' | 'any';

export const w_filter_tags = writable<Set<string>>(new Set());
export const w_filter_text = writable<string>('');
export const w_filter_mode = writable<T_Match>('all');

// The families the user has toggled on, saved across reloads. Empty means none
// picked. A plain string list of family names (the T_DocumentFamily values).
export const w_filter_families = preferences.persistent<string[]>(T_Preference.families, []);

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
