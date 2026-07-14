import { writable } from 'svelte/store';

// One source of truth for narrowing the documents list: which tags are picked
// and what filter text is typed. Views bind these; the filter function below
// keeps the two rules in one place.

// Whether a document must carry ALL the picked tags or just ANY of them.
export type T_Match = 'all' | 'any';

export const w_filter_tags = writable<Set<string>>(new Set());
export const w_filter_text = writable<string>('');
export const w_filter_mode = writable<T_Match>('all');

// Anything the filter can judge: a display name and the tag ids it carries.
export interface Filterable {
	name    : string;
	tag_ids : string[];
}

// Keep only rows matching the picked tags (all vs any) whose name contains the
// text (case-insensitive). Empty picks / empty text impose no constraint.
export function filter_rows<T extends Filterable>(rows: T[], tag_ids: Set<string>, text: string, mode: T_Match): T[] {
	const wanted = Array.from(tag_ids);
	const needle = text.trim().toLowerCase();
	const tag_ok = (row: T) => wanted.length === 0
		|| (mode === 'all' ? wanted.every((id) => row.tag_ids.includes(id))
		                   : wanted.some((id) => row.tag_ids.includes(id)));
	const kept = rows.filter((row) => tag_ok(row) && (needle === '' || row.name.toLowerCase().includes(needle)));
	console.log(`Search: ${wanted.length} tag(s) [${mode}] + text "${needle}" kept ${kept.length} of ${rows.length} document(s).`);
	return kept;
}
