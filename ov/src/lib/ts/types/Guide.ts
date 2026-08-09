// One node in the structure: either a guide file or a folder holding others.
// Overview never keeps a file's text — only where it is and the five labels off
// its top.

// The kinds a guide can be. The first five say how a guide reads; the last two say what it is
// about — a record of how something was built, or a note about work in hand. A file is one of
// the seven, said in its own labels rather than worked out from the folder it sits in.
export enum T_Kind {
	design     = 'design',
	explain    = 'explain',
	refer      = 'refer',
	specify    = 'specify',
	step       = 'step',
	wire       = 'wire',
	work       = 'work',
}

// The closed tag list — twenty-seven, alphabetized, nothing invented on the spot.
export const ALL_TAGS: string[] = [
	'build',
	'construct',
	'data',
	'debug',
	'deploy',
	'done',
	'geometry',
	'migrate',
	'notes',
	'platform',
	'port',
	'propose',
	'prose',
	'refactor',
	'research',
	'session',
	'setup',
	'stale',
	'style',
	'team',
	'test',
	'think',
	'tools',
	'UX',
	'vision',
	'visual-design',
	'wire',
];

/**
 * Putting words in alphabetical order the way a reader expects: capital letters count the
 * same as small ones, so "UX" sits between "tools" and "visual-design" rather than ahead of
 * everything. Every list of words shown on screen is ordered with this.
 */
export function in_order(one: string, two: string): number {
	return one.localeCompare(two, undefined, { sensitivity: 'base' });
}

// The four collections the guides live in, each named for the folder that holds it.
// The shared guides sit at the top of the repo, so their root is the repo's own folder.
export enum T_Bundle {
	mono = 'mo',
	ws   = 'ws',
	di   = 'di',
	ji   = 'ji',
	ov   = 'ov',
}

// The labels off a file's top. A folder carries none of them.
export type Labels = {
	kind        : string;     // one of the five — empty when the file carries no labels
	title       : string;     // the human name; falls back to the file's own name
	description : string;     // one sentence
	date        : string;     // year-month-day of its last real change
	labeled     : boolean;    // false for a file that carries no label block at all
};

export type Guide = Labels & {
	id        : string;      // unique within this launch
	name      : string;      // the file's or folder's own name
	bundle    : T_Bundle;    // which of the four collections it belongs to
	path      : string;      // where it sits inside that collection, folders and all
	address   : string;      // where its text can be read from, if ever wanted
	is_folder : boolean;
	is_design : boolean;     // a design says how a thing was built, a guide says how to work
};

// A guide paired with the tags on it — what a listing hands back. A folder appears
// too, so the shape of the folders shows. The tags are gathered once, here, so nothing
// that shows a row ever has to go looking them up.
export interface Filtered_Guide {
	guide         : Guide;
	key           : string;     // where it sits: its collection and its path, together
	tag_names     : string[];
	depth         : number;     // how many folders deep it sits (a root is 0)
	ancestor_keys : string[];   // the folder chain above it, root-first
	has_children  : boolean;    // holds anything nested under it, so it can open and shut
}

/** Where a guide sits — its collection and its path — which names it for good. */
export function key_of(guide: Guide): string {
	return `${guide.bundle}/${guide.path}`;
}
