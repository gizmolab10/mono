import type { T_Storage } from './DB_Records';
import { debug } from '../common/Debug';

// What a document's bytes are, by its filename extension — the UI reads this to
// open or show it. This is the one source of the enum; DB_Records re-exports it
// for older imports.

export enum S_Document {
	ready = 0,
	quick = 1,
	heavy = 2,
}

// The broad family a document falls into, from its reported type.
// A pdf and a web page are text as far as a family goes — both are words, and the
// viewer picks how to draw them from the file's own ending, not from its family.
export enum T_DocumentFamily {
    video  = 'video',
    audio  = 'audio',
	folder = 'folder',
    image  = 'image',
    text   = 'text',
	book   = 'book',
	sheet  = 'spreadsheet',
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

	avi     = 'avi',
	flv     = 'flv',
	m4v     = 'm4v',
	mkv     = 'mkv',
	mov     = 'mov',
	mp4     = 'mp4',
	mpg     = 'mpg',
	ogv     = 'ogv',
	webm    = 'webm',
	wmv     = 'wmv',

	aiff    = 'aiff',
	aac     = 'aac',
	flac    = 'flac',
	mp3     = 'mp3',
	wav     = 'wav',
	m4a     = 'm4a',
	ogg     = 'ogg',
	wma     = 'wma',

	csv     = 'csv',
	numbers = 'numbers',
	qb      = 'qb',

	epub    = 'epub',
	kfx     = 'kfx',
	azw3    = 'azw3',
	azw4    = 'azw4',
}

// The endings that hold a table, and the ones that hold a book. Kept apart from what
// a browser can show: none of these can be looked at here, but each holds words worth
// reading — a table's rows, a book's pages.
export const SHEET_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
		T_DocumentExtension.csv,
		T_DocumentExtension.numbers,
		T_DocumentExtension.qb,
]);

export const BOOK_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
		T_DocumentExtension.epub,
		T_DocumentExtension.kfx,
		T_DocumentExtension.azw3,
		T_DocumentExtension.azw4,
]);

// Endings a browser won't draw, but the model reads as they stand — so they are worth
// dropping even though a row of one never opens. Kept apart from the plain can't-be-shown
// list so the difference is visible: these need nothing done to them first.
export const ACCEPTABLE_UNVIEWABLE: ReadonlySet<T_DocumentExtension> =
	new Set([
		T_DocumentExtension.docx,
		T_DocumentExtension.mpg,
]);

// The endings a browser won't draw and the model can't read yet. Still taken in and
// saved — their words are the point — but each needs turning into something readable
// first (see the needs-converting list). Everything named in neither list can be shown:
// words, web pages, pdfs, pictures, and the clips and sound a browser plays.
export const UNVIEWABLE_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
		// word processing — no browser draws these
		T_DocumentExtension.doc,
		// clips and sound a browser won't play (still stored, still transcribable)
		T_DocumentExtension.avi,
		T_DocumentExtension.flv,
		T_DocumentExtension.mkv,
		T_DocumentExtension.wmv,
		T_DocumentExtension.aiff,
		T_DocumentExtension.wma,
		// tables
		T_DocumentExtension.csv,
		T_DocumentExtension.numbers,
		T_DocumentExtension.qb,
		// books
		T_DocumentExtension.epub,
		T_DocumentExtension.kfx,
		T_DocumentExtension.azw3,
		T_DocumentExtension.azw4,
]);

// Which endings are moving pictures and which are sound. Kept apart from what a
// browser can play: an avi belongs to the video family even though no browser
// will show it — it still has speech a transcriber can turn into words.
export const VIDEO_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
		T_DocumentExtension.avi,
		T_DocumentExtension.flv,
		T_DocumentExtension.mp4,
		T_DocumentExtension.m4v,
		T_DocumentExtension.mkv,
		T_DocumentExtension.mpg,
		T_DocumentExtension.mov,
		T_DocumentExtension.ogv,
		T_DocumentExtension.wmv,
		T_DocumentExtension.webm,
]);

export const AUDIO_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
		T_DocumentExtension.aac,
		T_DocumentExtension.aiff,
		T_DocumentExtension.flac,
		T_DocumentExtension.m4a,
		T_DocumentExtension.mp3,
		T_DocumentExtension.ogg,
		T_DocumentExtension.wav,
		T_DocumentExtension.wma,
]);

// The endings that are pictures. Needed on its own now that a family is no longer read
// off "how would the viewer draw this": a picture dropped through the folder door often
// reports no type at all, and its ending is the only thing left to tell by. An svg is
// here too — it is a picture, even though its bytes are words.
export const IMAGE_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
		T_DocumentExtension.bmp,
		T_DocumentExtension.gif,
		T_DocumentExtension.jpeg,
		T_DocumentExtension.png,
		T_DocumentExtension.svg,
		T_DocumentExtension.webp,
]);

// How a document's bytes are stored: these extensions save as their plain words;
// every other saves as the file's own raw bytes, untouched. The drop reads this to
// store the right way; the viewer reads it to interpret what it reads back.
export const TEXT_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
		T_DocumentExtension.csv,
		T_DocumentExtension.html,
		T_DocumentExtension.md,
		T_DocumentExtension.rtf,
		T_DocumentExtension.svg,
		T_DocumentExtension.txt,
]);

// The extensions whose stored bytes are already plain, readable words — nothing
// to pull out. Every other kind needs a text-extraction step first: markup has to
// be stripped (html, rtf, svg), pdfs and Word files have to be read, and pictures
// need their words recognized.
export const READY_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
		T_DocumentExtension.csv,
		T_DocumentExtension.md,
		T_DocumentExtension.txt,
]);

// The extensions whose words come out with a quick pull — strip the markup or read
// the document, no picture-reading or transcription. Everything else that isn't
// already plain words needs the heavy step (a picture's writing recognized, a clip's
// speech transcribed).
export const QUICK_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
		T_DocumentExtension.pdf,
		T_DocumentExtension.html,
		T_DocumentExtension.rtf,
		T_DocumentExtension.svg,
		T_DocumentExtension.doc,
		T_DocumentExtension.docx,
		T_DocumentExtension.epub,     // pages of marked-up words — stripped, no recognizing needed
]);

// The endings the reading tool won't take as they stand. Everything here holds
// words or speech — a clip has talking, a picture can have writing on it, a Word
// file and rich text have words wrapped in markup — but each has to be turned into
// something the reading tool accepts before it can be handed over. Its own list is
// short: plain words, web pages, pdf, docx, png, jpg, webp, and only mp3, wav,
// mp4, mpeg, ogg, oga, m4a, webm for sound and clips.
// Source: https://github.com/Mintplex-Labs/anything-llm/blob/master/collector/utils/constants.js
export const NEEDS_CONVERTING: ReadonlySet<T_DocumentExtension> =
	new Set([
		// clips it won't take — the speech has to be transcribed first
		T_DocumentExtension.mov,
		T_DocumentExtension.m4v,
		T_DocumentExtension.ogv,
		T_DocumentExtension.avi,
		T_DocumentExtension.mkv,
		T_DocumentExtension.wmv,
		T_DocumentExtension.flv,
		// sound it won't take — same, transcribed first
		T_DocumentExtension.flac,
		T_DocumentExtension.aac,
		T_DocumentExtension.wma,
		T_DocumentExtension.aiff,
		// pictures it won't take — re-saved as png, then its reader finds the writing
		T_DocumentExtension.gif,
		T_DocumentExtension.bmp,
		// words wrapped in markup — stripped down to plain words first
		T_DocumentExtension.svg,
		T_DocumentExtension.rtf,
		T_DocumentExtension.doc,
		// books — the pages have to be read out into plain words first
		T_DocumentExtension.epub,
		T_DocumentExtension.kfx,
		T_DocumentExtension.azw3,
		T_DocumentExtension.azw4,
		// an accounting file: not words at all until something reads its records out
		T_DocumentExtension.qb,
		// a Numbers table: a packed bundle, not words — exported to plain rows first
		T_DocumentExtension.numbers,
		// A table saved as plain text (csv) is NOT here: ji stores it as its own words,
		// and the upload path hands words over, not a file — so its ending never matters.
]);

// The largest single file we take in. Raw bytes are stored as-is, so nothing is
// held in memory while saving — but a browser's own storage puts a ceiling on one
// stored item, and refusing above this line with a clear message beats hitting
// that ceiling partway through a save.
export const MAX_FILE_BYTES = 1024 * 1024 * 1024;   // one gigabyte

// The AI store keeps a document's content inside AnythingLLM (in a side document's details
// field), not on this browser — and that field holds only a few megabytes. Binary content is
// stored base64 (about a third larger), so the safe per-file limit is well under the field's
// ~4 MB: refuse anything bigger, since its content couldn't be stored (or opened) there.
export const MAX_AI_FILE_BYTES = Math.floor(2.8 * 1024 * 1024);   // ~2.8 MB

// A byte count said the way a person reads it — "1.7 GB", "340 MB".
export function say_bytes(bytes: number): string {
	const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
	let size = bytes;
	let unit = 0;
	while (size >= 1024 && unit < units.length - 1) { size = size / 1024; unit = unit + 1; }
	return `${unit === 0 ? size : size.toFixed(1)} ${units[unit]}`;
}

export class Document {

	// A stored document: a handle to its blob plus what we show about it.

	storage?            : T_Storage;
	family?             : T_DocumentFamily;
	extension?          : T_DocumentExtension;
	reported_type?      : string;          // what the browser said the file was, verbatim
	size?               : number;          // how many bytes the file reported at drop time
	viewable            = false;
	status              = S_Document.ready;
	id                  : string = '';
	blob_id?            : string;          // refers to the storage of the actual bytes
	name?               : string;
	text?               : string;          // from extraction (quick or heavy)
	last_modified_date? : number | null;   // when the file was last changed, milliseconds since epoch; null for a folder
	metadata?           : any;

	// Can the user open and look at this kind here? Purely about showing — nothing to do
	// with whether its words have been pulled. A folder (no extension) is false, and so is
	// anything a browser won't draw, whether or not the model can read it; everything else
	// a browser draws for us.
	static is_viewable(extension: T_DocumentExtension | null | undefined): boolean {
		return extension != null
			&& !UNVIEWABLE_KINDS.has(extension)
			&& !ACCEPTABLE_UNVIEWABLE.has(extension);
	}

	// How ready a document's words are for the model. Ready when it is already plain
	// words (txt, md) or its text has already been pulled; otherwise a quick pull
	// (markup stripped, a pdf or word file read) or a heavy one (a picture's writing
	// recognized, a clip's speech transcribed). Purely about words — nothing to do
	// with viewing. Folders are handled by their family, not passed here.
	static status_of(extension: T_DocumentExtension | null | undefined, has_text: boolean): S_Document {
		if (has_text || (extension != null && READY_KINDS.has(extension))) { return S_Document.ready; }
		if (extension != null && QUICK_KINDS.has(extension)) { return S_Document.quick; }
		return S_Document.heavy;
	}

	// A plain, friendly word for each family — what the drop box shows instead of
	// a list of file endings.
	static family_label(family: T_DocumentFamily): string {
		switch (family) {
			case T_DocumentFamily.image:  return 'image';
			case T_DocumentFamily.video:  return 'video';
			case T_DocumentFamily.audio:  return 'sound';
			case T_DocumentFamily.text:   return 'text';
			case T_DocumentFamily.sheet:  return 'spreadsheet';
			case T_DocumentFamily.book:   return 'book';
			case T_DocumentFamily.folder: return 'folder';
		}
	}

	// The families a drop will save, worked out from the endings we accept — so the
	// list stays true by itself as new endings are added. Folders are left out (the
	// drop box already says it takes them).
	static accepted_families(): T_DocumentFamily[] {
		const accepted = new Set<T_DocumentFamily>();
		for (const extension of Object.values(T_DocumentExtension)) {
			accepted.add(Document.family_of('', extension));
		}
		accepted.delete(T_DocumentFamily.folder);
		return Object.values(T_DocumentFamily).filter((family) => accepted.has(family));
	}

	// Every file ending that belongs to one family, in the order they are written
	// down — the same knowledge as "what family is this ending", read backwards.
	// Alternate spellings are included, since a drop accepts them too. Worked out
	// from what we accept, so a newly accepted ending shows up here by itself.
	static endings_of(family: T_DocumentFamily): string[] {
		return Object.keys(Document.kind_byExtension)
			.filter((ending) => Document.family_of('', Document.kind_byExtension[ending]) === family);
	}

	// Which broad family a file belongs to. Tables and books are told by their ending.
	// Otherwise the browser's reported type decides, when its first word says something
	// useful (picture, clip, sound, words); failing that the ending decides. A pdf, a web
	// page, a Word file and plain words all count as text — words, however they are
	// wrapped — and the viewer picks how to draw each from its ending. Anything
	// unrecognized never gets this far, so a saved file always lands in a real family;
	// text is the last resort.
	static family_of(reported_type: string, extension: T_DocumentExtension | null | undefined): T_DocumentFamily {
		// Asked first: a table saved as plain text reports itself as text, and would
		// otherwise land in the text family.
		if (extension && SHEET_KINDS.has(extension)) { return T_DocumentFamily.sheet; }
		if (extension && BOOK_KINDS.has(extension))  { return T_DocumentFamily.book; }
		switch (reported_type.split('/')[0]) {
			case 'image': return T_DocumentFamily.image;
			case 'video': return T_DocumentFamily.video;
			case 'audio': return T_DocumentFamily.audio;
			case 'text':  return T_DocumentFamily.text;
		}
		if (extension && VIDEO_KINDS.has(extension)) { return T_DocumentFamily.video; }
		if (extension && AUDIO_KINDS.has(extension)) { return T_DocumentFamily.audio; }
		if (extension && IMAGE_KINDS.has(extension)) { return T_DocumentFamily.image; }
		return T_DocumentFamily.text;
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
		mp4: T_DocumentExtension.mp4, m4v: T_DocumentExtension.m4v,
		mov: T_DocumentExtension.mov, qt: T_DocumentExtension.mov,
		webm: T_DocumentExtension.webm,
		ogv: T_DocumentExtension.ogv,
		avi: T_DocumentExtension.avi,
		mkv: T_DocumentExtension.mkv,
		wmv: T_DocumentExtension.wmv,
		flv: T_DocumentExtension.flv,
		mpg: T_DocumentExtension.mpg, mpeg: T_DocumentExtension.mpg,
		mp3: T_DocumentExtension.mp3,
		wav: T_DocumentExtension.wav, wave: T_DocumentExtension.wav,
		ogg: T_DocumentExtension.ogg, oga: T_DocumentExtension.ogg,
		m4a: T_DocumentExtension.m4a,
		aac: T_DocumentExtension.aac,
		flac: T_DocumentExtension.flac,
		wma: T_DocumentExtension.wma,
		aiff: T_DocumentExtension.aiff, aif: T_DocumentExtension.aiff,
		csv: T_DocumentExtension.csv,
		numbers: T_DocumentExtension.numbers,
		qb: T_DocumentExtension.qb,
		epub: T_DocumentExtension.epub,
		kfx: T_DocumentExtension.kfx,
		azw3: T_DocumentExtension.azw3,
		azw4: T_DocumentExtension.azw4,
	};

	// The reported type as a fallback when the extension names no kind. The
	// specific text-based types are checked before the plain-text catch-all;
	// null when the type names no kind we save.
	static kind_byType(type: string): T_DocumentExtension | null {
		if (type === 'text/markdown')                          { return T_DocumentExtension.md; }
		if (type === 'text/html')                              { return T_DocumentExtension.html; }
		if (type === 'application/rtf' || type === 'text/rtf') { return T_DocumentExtension.rtf; }
		// A table saved as plain text is asked about before the plain-text catch-all below,
		// or it would be taken for ordinary words.
		if (type === 'text/csv' || type === 'application/csv')  { return T_DocumentExtension.csv; }
		if (type === 'application/epub+zip')                    { return T_DocumentExtension.epub; }
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
		if (type === 'video/mp4')                              { return T_DocumentExtension.mp4; }
		if (type === 'video/quicktime')                        { return T_DocumentExtension.mov; }
		if (type === 'video/webm')                             { return T_DocumentExtension.webm; }
		if (type === 'video/ogg')                              { return T_DocumentExtension.ogv; }
		if (type === 'video/x-msvideo')                        { return T_DocumentExtension.avi; }
		if (type === 'video/x-matroska')                       { return T_DocumentExtension.mkv; }
		if (type === 'video/x-ms-wmv')                         { return T_DocumentExtension.wmv; }
		if (type === 'video/x-flv')                            { return T_DocumentExtension.flv; }
		if (type === 'video/mpeg')                             { return T_DocumentExtension.mpg; }
		if (type === 'audio/mpeg' || type === 'audio/mp3')     { return T_DocumentExtension.mp3; }
		if (type === 'audio/wav'  || type === 'audio/x-wav')   { return T_DocumentExtension.wav; }
		if (type === 'audio/ogg')                              { return T_DocumentExtension.ogg; }
		if (type === 'audio/mp4' || type === 'audio/x-m4a')    { return T_DocumentExtension.m4a; }
		if (type === 'audio/aac')                              { return T_DocumentExtension.aac; }
		if (type === 'audio/flac' || type === 'audio/x-flac')  { return T_DocumentExtension.flac; }
		if (type === 'audio/x-ms-wma')                         { return T_DocumentExtension.wma; }
		if (type === 'audio/aiff' || type === 'audio/x-aiff')  { return T_DocumentExtension.aiff; }
		return null;
	}

	// Decide a dropped file's kind: its extension first, its reported type as a
	// fallback; null when neither names a type we save.
	static kind_of(file: File): T_DocumentExtension | null {
		const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
		const byExt = Document.kind_byExtension[ext];
		const kind = byExt ?? Document.kind_byType(file.type);
		debug.log_soon(`Kind of "${file.name}": extension ".${ext}" -> ${byExt ?? 'none'}, type "${file.type || 'none'}" -> chose ${kind}.`);
		// A kind a browser can't show here (a Word file, a spreadsheet, a book, the
		// unplayable clips) is still saved: its words are the point, not the looking. The
		// row simply doesn't open, and the stepper skips it.
		return kind;
	}

	// What to store for a file: readable words for the text kinds, and for every
	// other kind the file's own raw bytes, handed over untouched. Nothing is copied
	// into memory — a big movie used to be turned into one enormous piece of text
	// about a third larger than the file, which a browser cannot hold, and the tab
	// died. Raw bytes have no such ceiling.
	static bytes_of(file: File, kind: T_DocumentExtension): Promise<string | Blob> {
		if (TEXT_KINDS.has(kind)) { return file.text(); }
		return Promise.resolve(file as Blob);
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