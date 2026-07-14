import { writable } from 'svelte/store';

// One source of truth for narrowing the documents list: which tags are picked
// and what filter text is typed. Views bind these; the filter function below
// keeps the two rules in one place.

export const w_filter_tags = writable<Set<string>>(new Set());
export const w_filter_text = writable<string>('');

// Anything the filter can judge: a display name and the tag ids it carries.
export interface Filterable {
	name    : string;
	tag_ids : string[];
}

// Keep only rows that carry EVERY picked tag and whose name contains the text
// (case-insensitive). Empty picks / empty text impose no constraint.
export function filter_rows<T extends Filterable>(rows: T[], tag_ids: Set<string>, text: string): T[] {
	const wanted = Array.from(tag_ids);
	const needle = text.trim().toLowerCase();
	const kept = rows.filter((row) =>
		wanted.every((id) => row.tag_ids.includes(id)) &&
		(needle === '' || row.name.toLowerCase().includes(needle)));
	console.log(`Search: ${wanted.length} tag(s) + text "${needle}" kept ${kept.length} of ${rows.length} document(s).`);
	return kept;
}
