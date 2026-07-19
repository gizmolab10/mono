import type { T_Storage } from './DB_Records';
import { debug } from '../common/Debug';

// What a document's bytes are, by its filename extension — the UI reads this to
// open or show it. This is the one source of the enum; DB_Records re-exports it
// for older imports.

export enum S_Document {
	ready     = 0,
	needsText = 1,
}

// The broad family a document falls into, from its reported type.
export enum T_DocumentFamily {
    audio  = 'audio',
	folder = 'folder',
    image  = 'image',
	html   = 'html',
	other  = 'other',
    pdf    = 'pdf',
    text   = 'text',
    video  = 'video',
}

export enum T_DocumentExtension {
	bmp     = 'bmp',
	doc     = 'doc',
	docx    = 'docx',
	gif     = 'gif',
	html    = 'html',
	jpeg    = 'jpeg',
	md      = 'md',
	pdf     = 'pdf',
	png     = 'png',
	rtf     = 'rtf',
	svg     = 'svg',
	txt     = 'txt',
	webp    = 'webp',
}

// How a document's bytes are stored: these extensions save as their plain text;
// every other saves as a data-URL (its bytes base64-wrapped). The drop reads this
// to store the right way; the viewer reads it to interpret what it reads back.
export const TEXT_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
		T_DocumentExtension.txt,
		T_DocumentExtension.md,
		T_DocumentExtension.html,
		T_DocumentExtension.rtf,
		T_DocumentExtension.svg,
]);

// The extensions whose stored bytes are already plain, readable words — nothing
// to pull out. Every other kind needs a text-extraction step first: markup has to
// be stripped (html, rtf, svg), pdfs and Word files have to be read, and pictures
// need their words recognized.
export const READY_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
		T_DocumentExtension.txt,
		T_DocumentExtension.md,
]);

export class Document {

	// A stored document: a handle to its blob plus what we show about it.

	storage?            : T_Storage;
	family?             : T_DocumentFamily;
	extension?          : T_DocumentExtension;
	reported_type?      : string;          // what the browser said the file was, verbatim
	size?               : number;          // how many bytes the file reported at drop time
	status              = S_Document.needsText;
	id                  : string = '';
	blob_id?            : string;         // reference the storage resolves to the actual bytes
	url?                : string;
	name?               : string;
	text?               : string;
	last_modified_date? : number | null;   // when the file was last changed, milliseconds since epoch; null for a folder
	metadata?           : any;

	// How a document shows in the viewer, from its extension, or null when a
	// browser can't show it here (Word doc, docx, and the ones with no extension —
	// folders and unrecognized files). Static so it works on the plain objects
	// loaded from storage, which aren't real Document instances.
	static view_mode(extension: T_DocumentExtension | null | undefined): T_DocumentFamily | null {
		switch (extension) {
			case T_DocumentExtension.bmp:
			case T_DocumentExtension.gif:
			case T_DocumentExtension.jpeg:
			case T_DocumentExtension.png:
			case T_DocumentExtension.svg:
			case T_DocumentExtension.webp: return T_DocumentFamily.image;
			case T_DocumentExtension.pdf:  return T_DocumentFamily.pdf;
			case T_DocumentExtension.html: return T_DocumentFamily.html;
			case T_DocumentExtension.txt:
			case T_DocumentExtension.md:
			case T_DocumentExtension.rtf:  return T_DocumentFamily.text;
			default:                       return null;    // doc, docx, folder, unknown
		}
	}

	// Which broad family a file belongs to. The browser's reported type decides it
	// when that type says something useful (its first word — picture, video, sound,
	// text — plus pdf and web page as named cases). When the type is empty or
	// unhelpful, the extension decides instead, and anything still unplaced (Word
	// files and the like) falls to "other".
	static family_of(reported_type: string, extension: T_DocumentExtension | null | undefined): T_DocumentFamily {
		if (reported_type === 'application/pdf') { return T_DocumentFamily.pdf; }
		if (reported_type === 'text/html')       { return T_DocumentFamily.html; }
		switch (reported_type.split('/')[0]) {
			case 'image': return T_DocumentFamily.image;
			case 'video': return T_DocumentFamily.video;
			case 'audio': return T_DocumentFamily.audio;
			case 'text':  return T_DocumentFamily.text;
		}
		return Document.view_mode(extension) ?? T_DocumentFamily.other;
	}

	// A file extension → the kind we store it as. The primary signal, because a
	// dropped file's reported type is unreliable (empty or wrong for "Save page
	// as" files and files read through the folder door).
	static kind_byExtension: Record<string, T_DocumentExtension> = {
		md: T_DocumentExtension.md, markdown: T_DocumentExtension.md,
		html: T_DocumentExtension.html, htm: T_DocumentExtension.html,
		rtf: T_DocumentExtension.rtf,
		pdf: T_DocumentExtension.pdf,
		svg: T_DocumentExtension.svg,
		txt: T_DocumentExtension.txt, text: T_DocumentExtension.txt,
		jpg: T_DocumentExtension.jpeg, jpeg: T_DocumentExtension.jpeg,
		png: T_DocumentExtension.png,
		gif: T_DocumentExtension.gif,
		bmp: T_DocumentExtension.bmp,
		webp: T_DocumentExtension.webp,
		doc: T_DocumentExtension.doc,
		docx: T_DocumentExtension.docx,
	};

	// The reported type as a fallback when the extension names no kind. The
	// specific text-based types are checked before the plain-text catch-all;
	// null when the type names no kind we save.
	static kind_byType(type: string): T_DocumentExtension | null {
		if (type === 'text/markdown')                          { return T_DocumentExtension.md; }
		if (type === 'text/html')                              { return T_DocumentExtension.html; }
		if (type === 'application/rtf' || type === 'text/rtf') { return T_DocumentExtension.rtf; }
		if (type === 'application/pdf')                        { return T_DocumentExtension.pdf; }
		if (type === 'image/svg+xml')                          { return T_DocumentExtension.svg; }
		if (type.startsWith('text/'))                          { return T_DocumentExtension.txt; }
		if (type === 'image/jpeg')                             { return T_DocumentExtension.jpeg; }
		if (type === 'image/png')                              { return T_DocumentExtension.png; }
		if (type === 'image/gif')                              { return T_DocumentExtension.gif; }
		if (type === 'image/bmp')                              { return T_DocumentExtension.bmp; }
		if (type === 'image/webp')                             { return T_DocumentExtension.webp; }
		if (type === 'application/msword')                     { return T_DocumentExtension.doc; }
		if (type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { return T_DocumentExtension.docx; }
		return null;
	}

	// Decide a dropped file's kind: its extension first, its reported type as a
	// fallback; null when neither names a type we save.
	static kind_of(file: File): T_DocumentExtension | null {
		const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
		const byExt = Document.kind_byExtension[ext];
		const kind = byExt ?? Document.kind_byType(file.type);
		debug.log(`Kind of "${file.name}": extension ".${ext}" -> ${byExt ?? 'none'}, type "${file.type || 'none'}" -> chose ${kind}.`);
		return kind;
	}

	// The bytes to store for a file: plain text for the text kinds, a data-URL for
	// the rest.
	static bytes_of(file: File, kind: T_DocumentExtension): Promise<string> {
		if (TEXT_KINDS.has(kind)) { return file.text(); }
		return new Promise<string>((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.readAsDataURL(file);
		});
	}

	// Remove a trailing extension from a name when that extension is one this kind
	// is stored under — "photo.jpg" in a jpeg row shows "photo". A folder, an
	// unrecognized kind, or an extension that doesn't map to this kind stays whole.
	static strip_known_extension(name: string, kind: T_DocumentExtension | null | undefined): string {
		if (kind == null) { return name; }                  // a folder or an unrecognized file — nothing to strip
		const dot = name.lastIndexOf('.');
		if (dot <= 0) { return name; }                      // no extension (or a leading-dot name)
		const ext = name.slice(dot + 1).toLowerCase();
		return (Document.kind_byExtension[ext] === kind) ? name.slice(0, dot) : name;
	}
}