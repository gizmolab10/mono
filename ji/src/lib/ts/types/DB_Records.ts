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

// How a document's bytes are stored: these kinds save as their plain text; every
// other kind saves as a data-URL (its bytes base64-wrapped). The drop reads this
// to store the right way; the viewer reads it to interpret what it reads back.
export const TEXT_KINDS: ReadonlySet<T_DocumentKind> = new Set([
	T_DocumentKind.txt, T_DocumentKind.md, T_DocumentKind.html,
	T_DocumentKind.rtf, T_DocumentKind.svg,
]);

// How a document shows in the viewer, or null when a browser can't show it here
// (Word doc, docx, tiff, and the non-file kinds) — the view button stays disabled.
export type T_ViewMode = 'image' | 'pdf' | 'text';
export function view_mode(kind: T_DocumentKind): T_ViewMode | null {
	switch (kind) {
		case T_DocumentKind.bmp:
		case T_DocumentKind.gif:
		case T_DocumentKind.jpeg:
		case T_DocumentKind.png:
		case T_DocumentKind.svg:
		case T_DocumentKind.webp: return 'image';
		case T_DocumentKind.pdf:  return 'pdf';
		case T_DocumentKind.txt:
		case T_DocumentKind.md:
		case T_DocumentKind.html:
		case T_DocumentKind.rtf:  return 'text';
		default:                  return null;    // doc, docx, folder, unknown (tiff isn't a kind we store)
	}
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
