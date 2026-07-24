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
}

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

// How a document's bytes are stored: these extensions save as their plain words;
// every other saves as the file's own raw bytes, untouched. The drop reads this to
// store the right way; the viewer reads it to interpret what it reads back.
export const TEXT_KINDS: ReadonlySet<T_DocumentExtension> =
	new Set([
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
		T_DocumentExtension.md,
		T_DocumentExtension.txt,
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
]);

// The largest single file we take in. Raw bytes are stored as-is, so nothing is
// held in memory while saving — but a browser's own storage puts a ceiling on one
// stored item, and refusing above this line with a clear message beats hitting
// that ceiling partway through a save.
export const MAX_FILE_BYTES = 1024 * 1024 * 1024;   // one gigabyte

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
	status              = S_Document.needsText;
	id                  : string = '';
	blob_id?            : string;         // reference the storage resolves to the actual bytes
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
			case T_DocumentExtension.pdf:  return T_DocumentFamily.pdf;
			case T_DocumentExtension.html: return T_DocumentFamily.html;
			case T_DocumentExtension.txt:
			case T_DocumentExtension.md:
			case T_DocumentExtension.rtf:  return T_DocumentFamily.text;
			case T_DocumentExtension.bmp:
			case T_DocumentExtension.gif:
			case T_DocumentExtension.jpeg:
			case T_DocumentExtension.png:
			case T_DocumentExtension.svg:
			case T_DocumentExtension.webp: return T_DocumentFamily.image;
			// only the clips a browser will actually play; the rest (avi, mkv, wmv,
			// flv, mpg, wma, aiff) are stored and transcribable but not showable here
			case T_DocumentExtension.mp4:
			case T_DocumentExtension.m4v:
			case T_DocumentExtension.mov:
			case T_DocumentExtension.webm:
			case T_DocumentExtension.ogv:  return T_DocumentFamily.video;
			case T_DocumentExtension.mp3:
			case T_DocumentExtension.wav:
			case T_DocumentExtension.ogg:
			case T_DocumentExtension.m4a:
			case T_DocumentExtension.aac:
			case T_DocumentExtension.flac: return T_DocumentFamily.audio;
			default:                       return null;    // doc, docx, the unplayable clips, no ending
		}
	}

	// A plain, friendly word for each family — what the drop box shows instead of
	// a list of file endings.
	static family_label(family: T_DocumentFamily): string {
		switch (family) {
			case T_DocumentFamily.image:  return 'image';
			case T_DocumentFamily.video:  return 'video';
			case T_DocumentFamily.audio:  return 'sound';
			case T_DocumentFamily.pdf:    return 'pdf';
			case T_DocumentFamily.html:   return 'web page';
			case T_DocumentFamily.text:   return 'text';
			case T_DocumentFamily.folder: return 'folder';
			case T_DocumentFamily.other:  return 'other';
		}
	}

	// The families a drop will save, worked out from the endings we accept — so the
	// list stays true by itself as new endings are added. Folders are left out (the
	// drop box already says it takes them); "other" trails at the end.
	static accepted_families(): T_DocumentFamily[] {
		const accepted = new Set<T_DocumentFamily>();
		for (const extension of Object.values(T_DocumentExtension)) {
			accepted.add(Document.family_of('', extension));
		}
		accepted.delete(T_DocumentFamily.folder);
		const named = Object.values(T_DocumentFamily).filter((family) => accepted.has(family) && family !== T_DocumentFamily.other);
		return accepted.has(T_DocumentFamily.other) ? [...named, T_DocumentFamily.other] : named;
	}

	// Every file ending that belongs to one family, in the order they are written
	// down — the same knowledge as "what family is this ending", read backwards.
	// Alternate spellings are included, since a drop accepts them too. Worked out
	// from what we accept, so a newly accepted ending shows up here by itself.
	static endings_of(family: T_DocumentFamily): string[] {
		return Object.keys(Document.kind_byExtension)
			.filter((ending) => Document.family_of('', Document.kind_byExtension[ending]) === family);
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
		if (extension && VIDEO_KINDS.has(extension)) { return T_DocumentFamily.video; }
		if (extension && AUDIO_KINDS.has(extension)) { return T_DocumentFamily.audio; }
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
		debug.log(`Kind of "${file.name}": extension ".${ext}" -> ${byExt ?? 'none'}, type "${file.type || 'none'}" -> chose ${kind}.`);
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