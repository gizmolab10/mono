// The record shapes the structure is built from, ported from ji. Overview keeps
// none of them on disk — they are made fresh each launch from the guide files.

export interface Tag {
	id   : string;
	name : string;
}

// One tag placed on one guide. Many of these give a many-to-many link.
export interface Tagging {
	id       : string;
	tag_id   : string;
	file_id : string;
}

// A parent→child edge in an ordered graph. A node may have many parents.
export interface Relationship {
	id           : string;
	predicate_id : string;
	parent_id    : string;
	child_id     : string;
	sort_order   : number;    // orders children under one parent
}

// What a link means. Overview uses one: a folder holding what's inside it.
export interface Predicate {
	id   : string;
	type : string;
}
