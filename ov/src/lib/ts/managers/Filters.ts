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

// Any number of tags; empty means every tag.
export const w_tags = preferences.persistent<string[]>(T_Preference.filter_tags, []);

/**
 * The two ways picked tags can narrow the list. A file usually wears one or two, so asking
 * for all of three finds nothing — which is why any-of is where it starts.
 */
export enum T_Picking {
	any = 'any of',
	all = 'all of',
}

export const w_tag_picking = preferences.persistent<string>(T_Preference.tag_picking, T_Picking.any);

/** Does a file survive the tags that are picked? Nothing picked lets everything through. */
export function tags_match(picking: string, chosen: string[], worn: string[]): boolean {
	if (chosen.length === 0) { return true; }
	return picking === T_Picking.all
		? chosen.every((tag) => worn.includes(tag))
		: chosen.some((tag) => worn.includes(tag));
}

/** Exactly the tags on offer that are not picked — what inverting leaves picked. */
export function inverted(offered: string[], chosen: string[]): string[] {
	return offered.filter((tag) => !chosen.includes(tag));
}

/**
 * Which of the remembered words are still among the choices. A word picked last visit and
 * since renamed or dropped would narrow the list while showing nowhere — nothing to press to
 * undo it — so it is let go at launch. Hands back the very list it was given when every one
 * survives, so nothing is written for no reason.
 */
export function kept_from(remembered: string[], choices: string[]): string[] {
	const still_real = remembered.filter((one) => choices.includes(one));
	return still_real.length === remembered.length ? remembered : still_real;
}

// Three remembered words are let go here, all by the one rule above.
{
	const tags = kept_from(get(w_tags), ALL_TAGS);
	if (tags !== get(w_tags)) { w_tags.set(tags); }
	const kinds = [UNLABELED, ...Object.values(T_Kind)] as string[];
	if (kept_from([get(w_kind)], ['', ...kinds]).length === 0) { w_kind.set(''); }
	if (kept_from([get(w_tag_picking)], Object.values(T_Picking)).length === 0) { w_tag_picking.set(T_Picking.any); }
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

/**
 * What a click on the bare space beside the pills means: shut every area at once — or, when they
 * are all shut already, open every one. So the same press always does something, and the way back
 * from six shut areas is the same press that shut them.
 */
export function toggle_all_areas(every_name: string[]): void {
	w_areas_open.update((open) => open.length === 0 ? [...every_name] : []);
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
