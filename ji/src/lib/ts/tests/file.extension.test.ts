import { describe, it, expect, beforeEach } from 'vitest';
import { Document, S_Document, T_DocumentExtension, T_DocumentFamily, TEXT_KINDS } from '../types/Document';
import { T_Storage } from '../types/DB_Records';
import { Hierarchy } from '../managers/Hierarchy';
import { DB_Local } from '../database/DB_Local';

// Every kind of file ji takes, one real file each: built here from real bytes, handed
// through the same path a drop uses (decide the kind, read the bytes the way that kind
// is stored, save it), then read back and checked.
//
// The bytes are real but the documents are not valid — a picture here is the few bytes
// that mark it a picture, not a picture a browser would draw. Nothing in ji reads inside
// a file yet, so that is enough to prove everything it decides today. The moment the
// reading-out of words is built, these samples have to become valid documents.

// A stand-in for browser storage, so the local store runs under a plain node test.
class Mock_Storage {
	private map = new Map<string, string>();
	getItem(key: string): string | null { return this.map.has(key) ? this.map.get(key)! : null; }
	setItem(key: string, value: string): void { this.map.set(key, value); }
	removeItem(key: string): void { this.map.delete(key); }
	clear(): void { this.map.clear(); }
	get length(): number { return this.map.size; }
	key(at: number): string | null { return Array.from(this.map.keys())[at] ?? null; }
}

// Bytes from a mix of plain words and raw numbers, so a format's leading marks can be
// written the way they are usually quoted ('%PDF-1.4', or 0x89 then 'PNG').
function bytes(...parts: Array<string | number>): Uint8Array {
	const out: number[] = [];
	for (const part of parts) {
		if (typeof part === 'number') { out.push(part); }
		else { for (const letter of part) { out.push(letter.charCodeAt(0)); } }
	}
	return new Uint8Array(out);
}

const WORDS = 'ALPHA BETA GAMMA — a few words, the same in every file that holds words.';

// What each kind is: the file to build, and all five answers about it. This table is the
// spec — the check at the end makes sure it names every kind ji takes, so a newly added
// ending fails here until someone writes down what it is.
interface Kind_Row {
	kind      : T_DocumentExtension;
	name      : string;                       // the file's name, ending included
	type      : string;                       // what a browser would report — empty for the ones it says nothing about
	content   : string | Uint8Array;          // real words, or real bytes
	family    : T_DocumentFamily;
	showable  : boolean;
	readiness : S_Document;
}

const E = T_DocumentExtension;
const F = T_DocumentFamily;
const S = S_Document;

const KINDS: Kind_Row[] = [
	// words, and the things made of words
	{ kind: E.txt,  name: 'notes.txt',   type: 'text/plain',    content: WORDS, family: F.text, showable: true,  readiness: S.ready },
	{ kind: E.md,   name: 'notes.md',    type: 'text/markdown', content: `# heading\n\n${WORDS}\n`, family: F.text, showable: true, readiness: S.ready },
	{ kind: E.rtf,  name: 'letter.rtf',  type: 'application/rtf', content: `{\\rtf1\\ansi ${WORDS}}`, family: F.text, showable: true, readiness: S.quick },
	{ kind: E.html, name: 'page.html',   type: 'text/html',     content: `<html><body><p>${WORDS}</p></body></html>`, family: F.text, showable: true, readiness: S.quick },
	{ kind: E.pdf,  name: 'paper.pdf',   type: 'application/pdf', content: bytes('%PDF-1.4\n%', 0xE2, 0xE3, 0xCF, 0xD3, '\n'), family: F.text, showable: true, readiness: S.quick },
	{ kind: E.doc,  name: 'letter.doc',  type: 'application/msword', content: bytes(0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1), family: F.text, showable: false, readiness: S.quick },
	{ kind: E.docx, name: 'letter.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', content: bytes('PK', 0x03, 0x04), family: F.text, showable: false, readiness: S.quick },

	// pictures — an svg is a picture whose bytes are words
	{ kind: E.png,  name: 'photo.png',   type: 'image/png',  content: bytes(0x89, 'PNG', 0x0D, 0x0A, 0x1A, 0x0A), family: F.image, showable: true, readiness: S.heavy },
	{ kind: E.jpeg, name: 'photo.jpg',   type: 'image/jpeg', content: bytes(0xFF, 0xD8, 0xFF, 0xE0), family: F.image, showable: true, readiness: S.heavy },
	{ kind: E.gif,  name: 'photo.gif',   type: 'image/gif',  content: bytes('GIF89a'), family: F.image, showable: true, readiness: S.heavy },
	{ kind: E.bmp,  name: 'photo.bmp',   type: 'image/bmp',  content: bytes('BM', 0x3A, 0x00, 0x00, 0x00), family: F.image, showable: true, readiness: S.heavy },
	{ kind: E.webp, name: 'photo.webp',  type: 'image/webp', content: bytes('RIFF', 0x1A, 0x00, 0x00, 0x00, 'WEBP'), family: F.image, showable: true, readiness: S.heavy },
	{ kind: E.svg,  name: 'drawing.svg', type: 'image/svg+xml', content: `<svg xmlns='http://www.w3.org/2000/svg'><text>${WORDS}</text></svg>`, family: F.image, showable: true, readiness: S.quick },

	// clips — the last five are ones no browser plays
	{ kind: E.mp4,  name: 'clip.mp4',    type: 'video/mp4',       content: bytes(0x00, 0x00, 0x00, 0x18, 'ftypmp42'), family: F.video, showable: true, readiness: S.heavy },
	{ kind: E.m4v,  name: 'clip.m4v',    type: '',                content: bytes(0x00, 0x00, 0x00, 0x18, 'ftypM4V '), family: F.video, showable: true, readiness: S.heavy },
	{ kind: E.mov,  name: 'clip.mov',    type: 'video/quicktime', content: bytes(0x00, 0x00, 0x00, 0x14, 'ftypqt  '), family: F.video, showable: true, readiness: S.heavy },
	{ kind: E.webm, name: 'clip.webm',   type: 'video/webm',      content: bytes(0x1A, 0x45, 0xDF, 0xA3), family: F.video, showable: true, readiness: S.heavy },
	{ kind: E.ogv,  name: 'clip.ogv',    type: 'video/ogg',       content: bytes('OggS', 0x00, 0x02), family: F.video, showable: true, readiness: S.heavy },
	{ kind: E.avi,  name: 'clip.avi',    type: 'video/x-msvideo', content: bytes('RIFF', 0x1A, 0x00, 0x00, 0x00, 'AVI '), family: F.video, showable: false, readiness: S.heavy },
	{ kind: E.mkv,  name: 'clip.mkv',    type: 'video/x-matroska', content: bytes(0x1A, 0x45, 0xDF, 0xA3, 0x01), family: F.video, showable: false, readiness: S.heavy },
	{ kind: E.wmv,  name: 'clip.wmv',    type: 'video/x-ms-wmv',  content: bytes(0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11), family: F.video, showable: false, readiness: S.heavy },
	{ kind: E.flv,  name: 'clip.flv',    type: 'video/x-flv',     content: bytes('FLV', 0x01, 0x05), family: F.video, showable: false, readiness: S.heavy },
	{ kind: E.mpg,  name: 'clip.mpg',    type: 'video/mpeg',      content: bytes(0x00, 0x00, 0x01, 0xBA), family: F.video, showable: false, readiness: S.heavy },

	// sound — the last two are ones no browser plays
	{ kind: E.mp3,  name: 'song.mp3',    type: 'audio/mpeg',   content: bytes('ID3', 0x03, 0x00), family: F.audio, showable: true, readiness: S.heavy },
	{ kind: E.wav,  name: 'song.wav',    type: 'audio/wav',    content: bytes('RIFF', 0x1A, 0x00, 0x00, 0x00, 'WAVE'), family: F.audio, showable: true, readiness: S.heavy },
	{ kind: E.ogg,  name: 'song.ogg',    type: 'audio/ogg',    content: bytes('OggS', 0x00, 0x02, 0x01), family: F.audio, showable: true, readiness: S.heavy },
	{ kind: E.m4a,  name: 'song.m4a',    type: 'audio/x-m4a',  content: bytes(0x00, 0x00, 0x00, 0x18, 'ftypM4A '), family: F.audio, showable: true, readiness: S.heavy },
	{ kind: E.aac,  name: 'song.aac',    type: 'audio/aac',    content: bytes(0xFF, 0xF1, 0x50, 0x80), family: F.audio, showable: true, readiness: S.heavy },
	{ kind: E.flac, name: 'song.flac',   type: 'audio/flac',   content: bytes('fLaC', 0x00), family: F.audio, showable: true, readiness: S.heavy },
	{ kind: E.aiff, name: 'song.aiff',   type: 'audio/aiff',   content: bytes('FORM', 0x00, 0x00, 0x00, 0x1A, 'AIFF'), family: F.audio, showable: false, readiness: S.heavy },
	{ kind: E.wma,  name: 'song.wma',    type: 'audio/x-ms-wma', content: bytes(0x30, 0x26, 0xB2, 0x75, 0x8E, 0x66, 0xCF, 0x11, 0x01), family: F.audio, showable: false, readiness: S.heavy },

	// tables — none showable here; only the plain-text one is words already
	{ kind: E.csv,     name: 'rows.csv',      type: 'text/csv', content: 'name,count\nALPHA,1\nBETA,2\n', family: F.sheet, showable: false, readiness: S.ready },
	{ kind: E.numbers, name: 'rows.numbers',  type: '',         content: bytes('PK', 0x03, 0x04, 0x14), family: F.sheet, showable: false, readiness: S.heavy },
	{ kind: E.qb,      name: 'ledger.qb',     type: '',         content: bytes('QBMB', 0x00, 0x01), family: F.sheet, showable: false, readiness: S.heavy },

	// books — none showable here
	{ kind: E.epub, name: 'novel.epub',  type: 'application/epub+zip', content: bytes('PK', 0x03, 0x04, 0x0A), family: F.book, showable: false, readiness: S.quick },
	{ kind: E.kfx,  name: 'novel.kfx',   type: '', content: bytes('CONT', 0x02, 0x00), family: F.book, showable: false, readiness: S.heavy },
	{ kind: E.azw3, name: 'novel.azw3',  type: '', content: bytes('BOOKMOBI', 0x00), family: F.book, showable: false, readiness: S.heavy },
	{ kind: E.azw4, name: 'novel.azw4',  type: '', content: bytes('BOOKMOBI', 0x01), family: F.book, showable: false, readiness: S.heavy },
];

// One real file, the way a drop hands one over.
function file_for(row: Kind_Row): File {
	const part: BlobPart = (typeof row.content === 'string') ? row.content : new Uint8Array(row.content).buffer;
	return new File([part], row.name, { type: row.type, lastModified: 1_700_000_000_000 });
}

// A fresh store and the tree over it, the way a reload builds them.
function make(): { db: DB_Local; h: Hierarchy } {
	const db = new DB_Local(T_Storage.private);
	const h  = new Hierarchy(db);
	h.fetch_all();
	return { db, h };
}

// Save one file the way a drop does: decide its kind, read its bytes the way that kind is
// stored, then hand it to the store.
async function save(h: Hierarchy, file: File) {
	const kind = Document.kind_of(file);
	expect(kind).not.toBe(null);
	const content = await Document.bytes_of(file, kind!);
	const from_file = { last_modified_date: file.lastModified, size: file.size, reported_type: file.type };
	return { kind: kind!, document: await h.add_document(file.name, kind!, content, from_file) };
}

beforeEach(() => {
	(globalThis as any).localStorage = new Mock_Storage();
});

describe('every kind of file, as a real file', () => {
	for (const row of KINDS) {
		it(`takes in a ${row.kind} file, saves it, and hands back exactly what went in`, async () => {
			const { db, h } = make();
			const file = file_for(row);

			const { kind, document } = await save(h, file);

			// what it was taken for
			expect(kind).toBe(row.kind);
			expect(document.family).toBe(row.family);
			expect(document.viewable).toBe(row.showable);
			expect(document.status).toBe(row.readiness);
			expect(document.size).toBe(file.size);
			expect(document.last_modified_date).toBe(file.lastModified);

			// stored as its own words, or as its raw bytes — never the other way
			const held = await db.read_blob(document.id);
			if (TEXT_KINDS.has(row.kind)) {
				expect(typeof held).toBe('string');
				expect(held).toBe(typeof row.content === 'string' ? row.content : '');
			} else {
				expect(typeof held).not.toBe('string');
				const back = new Uint8Array(await (held as Blob).arrayBuffer());
				expect(Array.from(back)).toEqual(Array.from(row.content as Uint8Array));
			}
		});
	}

	it('holds all of them at once, and finds each again after a reload', async () => {
		const { h } = make();
		for (const row of KINDS) { await save(h, file_for(row)); }

		const { db: reloaded_db, h: reloaded } = make();
		const listed = reloaded.list_documents();
		expect(listed.length).toBe(KINDS.length);

		for (const row of KINDS) {
			const document = reloaded.document_byName(row.name);
			expect(document, `"${row.name}" is missing after the reload`).not.toBe(null);
			expect(document!.family).toBe(row.family);
			expect(document!.viewable).toBe(row.showable);
			expect(document!.status).toBe(row.readiness);
			expect(await reloaded_db.read_blob(document!.id)).not.toBe(null);
		}
	});

	it('names every kind ji takes, and names no kind it does not', () => {
		const in_table = KINDS.map((row) => row.kind).sort();
		const taken    = Object.values(T_DocumentExtension).sort();
		expect(in_table).toEqual(taken);
		expect(new Set(in_table).size).toBe(in_table.length);   // no kind written down twice
	});
});
