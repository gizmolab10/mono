import { preferences, T_Preference } from './Preferences';
import { ALL_TAGS, T_Kind } from '../types/File';
import { get } from 'svelte/store';

/**
 * Filters — the four things that decide which guides show.
 *
 * They live here rather than inside whatever draws them, because the hierarchy is what
 * narrows the list now, and it has to be able to read them. All four are remembered
 * across visits.
 */

// One collection at a time; empty means every collection.
export const w_project = preferences.persistent<string>(T_Preference.filter_project, '');

// One kind at a time; empty means every kind. One more word than the seven kinds: this one
// asks for the files that carry no labels at all, which is how they are found and given some.
export const UNLABELED = 'none';

export const w_kind = preferences.persistent<string>(T_Preference.filter_kind, '');

/** Does a file survive the kind that is picked? */
export function kind_matches(kind: string, its_kind: string, labeled: boolean): boolean {
	if (kind === '')          { return true; }
	if (kind === UNLABELED)   { return !labeled; }
	return its_kind === kind;
}

// Any number of tags; empty means every tag. These widen rather than narrow — a file
// matches if it wears any one of them — since a file usually wears only one or two and
// asking for all of three would find nothing.
export const w_tags = preferences.persistent<string[]>(T_Preference.filter_tags, []);

// A word that was picked last visit and has since been renamed or dropped would narrow the
// list to nothing while no longer showing anywhere — nothing to click to undo it. So anything
// remembered that is no longer on either closed list is let go at launch.
{
	const remembered_tags = get(w_tags);
	const still_real = remembered_tags.filter((tag) => ALL_TAGS.includes(tag));
	if (still_real.length !== remembered_tags.length) { w_tags.set(still_real); }
	const remembered_kind = get(w_kind);
	if (remembered_kind !== '' && remembered_kind !== UNLABELED
		&& !Object.values(T_Kind).includes(remembered_kind as T_Kind)) { w_kind.set(''); }
}

// Words looked for in a guide's title and description, ignoring case.
export const w_words = preferences.persistent<string>(T_Preference.filter_text, '');

// Which folders are shut, named by where each one sits rather than by the number it
// happens to get this launch, since those numbers are made fresh every time.
export const w_shut = preferences.persistent<string[]>(T_Preference.folders_shut, []);

// Whether the folders show at all. With them off the list is a flat run of files — the
// folders still decide what a shut fold hides, they just aren't drawn.
export const w_show_folders = preferences.persistent<boolean>(T_Preference.show_folders, true);

// Whether the three picking rows show at all. The words looked for stay either way — they are
// the one filter worth keeping in reach while the list has the height. Held here rather than in
// the rows themselves, since the count row below reads it too: with the rows folded away there
// is no heavy line for the count to stand under.
export const w_show_filters = preferences.persistent<boolean>(T_Preference.show_filters, true);

// Which areas of tags are open, named rather than numbered so renaming or adding one cannot
// shift the meaning of what was saved. Both the filters and the label form read the same list,
// so an area left open in one is open in the other.
export const w_areas_open = preferences.persistent<string[]>(T_Preference.areas_open, []);

/** Open or shut one area of tags. */
export function toggle_area(name: string): void {
	w_areas_open.update((open) => open.includes(name) ? open.filter((one) => one !== name) : [...open, name]);
}

/** Shut every area at once — what a click on the bare space beside the pills means. */
export function shut_all_areas(): void {
	w_areas_open.set([]);
}

// Which columns the list is sorted by, and which way each runs. Sorting is offered only
// while the folders are hidden — with them on, the list is folders leading their contents,
// and a sort would have to either scramble them or sort inside each one.
export enum T_Sort {
	kind    = 'kind',
	project = 'project',
	name    = 'name',
	tags    = 'tags',
}

// One entry per column being sorted by, in the order they were picked: the first decides,
// and each one after it only breaks a tie in the ones before. An empty list means the
// walk's own order.
export type Sort = { by: string; up: boolean };

export const w_sorts = preferences.persistent<Sort[]>(T_Preference.sorts, []);

/** What they all say right now, in one piece, for handing to the narrowing. */
export type Narrowing = {
	project : string;
	kind    : string;
	tags    : string[];
	words   : string;
	shut    : string[];
};
