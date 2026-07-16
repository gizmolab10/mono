// The five db record shapes plus the storage/kind/predicate enumerations.
// A document's bytes (its blob) live outside the db and are reached by the
// document's id through the storage's blob seam — see DB_Common.

// Which storage holds a document's blob.
export enum T_Storage {
	shared  = 'shared',
	private = 'private',
}

// What a document's bytes are, so the UI can open or show it.
export enum T_DocumentKind {
	bmp     = 'bmp',
	doc     = 'doc',
	docx    = 'docx',
	folder  = 'folder',
	gif     = 'gif',
	html    = 'html',
	jpeg    = 'jpeg',
	md      = 'md',
	pdf     = 'pdf',
	png     = 'png',
	rtf     = 'rtf',
	svg     = 'svg',
	txt     = 'txt',
	unknown = 'unknown',
	webp    = 'webp',
}

// The five stored record kinds, so save/load loops can walk them by name.
export enum T_Record {
	relationships = 'relationships',
	predicates    = 'predicates',
	documents     = 'documents',
	taggings      = 'taggings',
	tags          = 'tags',
}

// A stored document: a handle to its blob plus what we show about it.
export interface Document {
	kind     : T_DocumentKind;
	storage  : T_Storage;
	id       : string;
	blob_id  : string;         // reference the storage resolves to the actual bytes
	name     : string;
	date     : number;         // created/modified, milliseconds since epoch
	metadata : any;
}

// A tag.
export interface Tag {
	id   : string;
	name : string;
}

// One tag placed on one document. Many of these give a many-to-many link.
export interface Tagging {
	id          : string;
	tag_id      : string;
	document_id : string;
}

// A parent→child edge in an ordered graph. A node may have many parents.
// parent_id / child_id refer to either a document or a tag.
export interface Relationship {
	id           : string;
	predicate_id : string;
	parent_id    : string;
	child_id     : string;
	sort_order   : number;    // orders children under one parent
}

// The meaning of a relationship edge (parent-of, related-to, ...).
export interface Predicate {
	id   : string;
	type : string;
}
