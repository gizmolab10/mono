// One node in the structure: either a guide file or a folder holding others.
// Overview never keeps a file's text — only where it is and the five labels off
// its top.

// The kinds a file can be, and the closed list of tags, are the host's: two lists of words the
// host hands kb in customizations.kinds and customizations.tags before anything mounts, since
// step 7 of the plan. A file's kind is one word off the first list, said in the db rather than
// worked out from the folder it sits in, and nothing is invented on the spot.

/**
 * Putting words in alphabetical order the way a reader expects: capital letters count the
 * same as small ones, so "UX" sits between "tools" and "vision" rather than ahead of
 * everything. Every list of words shown on screen is ordered with this.
 */
export function in_order(one: string, two: string): number {
	return one.localeCompare(two, undefined, { sensitivity: 'base' });
}

// The collections the files live in, each named for the folder that holds it.
// The shared files sit at the top of the repo, so their root is the repo's own folder.
export enum T_Bundle {
	mono    = 'mo',
	memory  = 'memory',
	shared  = 'shared',
	gallery = 'gallery',
	core    = 'core',
	ws      = 'ws',
	me      = 'me',
	di      = 'di',
	ji      = 'ji',
	lv      = 'lv',
	ov      = 'ov',
	mu      = 'mu',
	mj      = 'mj',
}

/**
 * The project a file answers to. Memory's project sub-folders belong to their projects —
 * memory/mu to mu, memory/ov to ov — so a memory file's project is its first folder whenever
 * that folder names a project on the list (core, me and shared are memory-only projects,
 * on the list with no folder of guides). Anything else in memory stays memory's.
 */
export function project_of(file: File): string {
	return project_at(file.bundle, file.path);
}

/** The same answer for a file not yet made: the listing asks before it hangs the file anywhere. */
export function project_at(bundle: T_Bundle, path: string): T_Bundle {
	if (bundle !== T_Bundle.memory) { return bundle; }
	const first = path.split('/')[0];
	return (Object.values(T_Bundle) as string[]).includes(first) ? first as T_Bundle : T_Bundle.memory;
}

// The labels off a file's top. A folder carries none of them.
export type Labels = {
	kind        : string;     // one of the host's kinds — empty when the file carries no labels
	title       : string;     // the human name; falls back to the file's own name
	description : string;     // one sentence
	use_when    : string[];   // the occasions this file should be read on; empty for a file that names none
	date        : string;     // year-month-day of its last real change
	labeled     : boolean;    // false for a file that carries no label block at all
};

export type File = Labels & {
	id        : string;      // unique within this launch
	name      : string;      // the file's or folder's own name
	bundle    : T_Bundle;    // which collection it belongs to
	path      : string;      // where it sits inside that collection, folders and all
	address   : string;      // where its text can be read from, if ever wanted
	is_folder : boolean;
	is_design : boolean;
	size      : number;      // how many characters its text held when it was read at launch; 0 for a folder     // a design says how a thing was built, a guide says how to work
	missing?  : boolean;     // the db holds it, labels and all, but no file sits at its path on disk
};

// A guide paired with the tags on it — what a listing hands back. A folder appears
// too, so the shape of the folders shows. The tags are gathered once, here, so nothing
// that shows a row ever has to go looking them up.
export interface Filtered_File {
	file          : File;
	key           : string;     // where it sits: its collection and its path, together
	tag_names     : string[];
	depth         : number;     // how many folders deep it sits (a root is 0)
	ancestor_keys : string[];   // the folder chain above it, root-first
	has_children  : boolean;    // holds anything nested under it, so it can open and shut
}

/** Where a guide sits — its collection and its path — which names it for good. */
export function key_of(guide: File): string {
	return `${guide.bundle}/${guide.path}`;
}
