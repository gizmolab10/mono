// One node in the structure: either a guide file or a folder holding others.
// Overview never keeps a file's text — only where it is and the five labels off
// its top.

// The five kinds, in the order the OKF proposal picks them.
export enum T_Kind {
	rule         = 'rule',
	procedure    = 'procedure',
	architecture = 'architecture',
	philosophy   = 'philosophy',
	reference    = 'reference',
}

// The closed tag list — twenty-two, nothing invented on the spot.
export const ALL_TAGS: string[] = [
	'collaboration', 'prose', 'session-start', 'code-style', 'visual-design',
	'refactoring', 'migration', 'testing', 'debugging', 'build', 'deploy',
	'setup', 'tools', 'philosophy', 'porting', 'notes',
	'architecture', 'data', 'geometry', 'user-interface', 'platform', 'research',
];

// The four collections the guides live in, each named for the folder that holds it.
// The shared guides sit at the top of the repo, so their root is the repo's own folder.
export enum T_Bundle {
	mono = 'mono',
	di   = 'di',
	ws   = 'ws',
	ji   = 'ji',
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
};

// A guide paired with the tags on it — what a listing hands back. A folder appears
// too, so the shape of the folders shows.
export interface Listed_Guide {
	guide        : Guide;
	tag_names    : string[];
	depth        : number;     // how many folders deep it sits (a root is 0)
	ancestor_ids : string[];   // the folder chain above it, root-first
	has_children : boolean;    // holds anything nested under it, so it can open and shut
}
