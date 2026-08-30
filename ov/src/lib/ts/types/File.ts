// One node in the structure: either a guide file or a folder holding others.
// Overview never keeps a file's text — only where it is and the five labels off
// its top.

// The kinds a guide can be. Four say how a guide reads; analyze says what it is about — a taking
// apart of something to find out how it works. A file is one of the five, said in its own labels
// rather than worked out from the folder it sits in.
export enum T_Kind {
	analyze    = 'analyze',
	arch       = 'arch',
	explain    = 'explain',
	howto      = 'howto',
	specify    = 'specify',
}

// The closed tag list — thirty-five, alphabetized, nothing invented on the spot.
export const ALL_TAGS: string[] = [
	'always',
	'build',
	'data',
	'debug',
	'deploy',
	'faster',
	'geometry',
	'journal',
	'keep',
	'later',
	'maybe',
	'migrate',
	'next',
	'notes',
	'now',
	'plans',
	'platform',
	'port',
	'program',
	'proposal',
	'prose',
	'refactor',
	'research',
	'session',
	'setup',
	'soon',
	'stale',
	'style',
	'tabled',
	'team',
	'test',
	'tools',
	'UX',
	'vision',
	'visual',
];

/**
 * Putting words in alphabetical order the way a reader expects: capital letters count the
 * same as small ones, so "UX" sits between "tools" and "vision" rather than ahead of
 * everything. Every list of words shown on screen is ordered with this.
 */
export function in_order(one: string, two: string): number {
	return one.localeCompare(two, undefined, { sensitivity: 'base' });
}

// The collections the guides live in, each named for the folder that holds it.
// The shared guides sit at the top of the repo, so their root is the repo's own folder.
export enum T_Bundle {
	mono = 'mo',
	ws   = 'ws',
	di   = 'di',
	ji   = 'ji',
	lv   = 'lv',
	mu   = 'mu',
	ov   = 'ov',
	memory = 'memory',
}

/**
 * The project a file answers to. Memory's project sub-folders belong to their projects —
 * memory/mu to mu, memory/ov to ov — so a memory file's project is its first folder whenever
 * that folder names a collection. Anything else in memory (shared, a project with no
 * collection of its own) stays memory's.
 */
export function project_of(file: File): string {
	if (file.bundle !== T_Bundle.memory) { return file.bundle; }
	const first = file.path.split('/')[0];
	return (Object.values(T_Bundle) as string[]).includes(first) ? first : T_Bundle.memory;
}

// The labels off a file's top. A folder carries none of them.
export type Labels = {
	kind        : string;     // one of the five — empty when the file carries no labels
	title       : string;     // the human name; falls back to the file's own name
	description : string;     // one sentence
	use_when    : string[];   // the occasions this file should be read on; empty for a file that names none
	date        : string;     // year-month-day of its last real change
	labeled     : boolean;    // false for a file that carries no label block at all
};

export type File = Labels & {
	id        : string;      // unique within this launch
	name      : string;      // the file's or folder's own name
	bundle    : T_Bundle;    // which of the four collections it belongs to
	path      : string;      // where it sits inside that collection, folders and all
	address   : string;      // where its text can be read from, if ever wanted
	is_folder : boolean;
	is_design : boolean;
	size      : number;      // how many characters its text held when it was read at launch; 0 for a folder     // a design says how a thing was built, a guide says how to work
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
