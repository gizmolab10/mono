import { describe, it, expect } from 'vitest';
import { Document, T_DocumentExtension, T_DocumentFamily, S_Document,
	UNVIEWABLE_KINDS, ACCEPTABLE_UNVIEWABLE, NEEDS_CONVERTING } from '../types/Document';

// A dropped file, stood in for: only the three things the deciding reads.
function dropped(name: string, type = ''): File {
	return { name, type, size: 10, lastModified: 0 } as unknown as File;
}

describe('the spreadsheet and book families', () => {
	it('puts a table in the spreadsheet family even though it reports itself as plain text', () => {
		expect(Document.kind_of(dropped('books.csv', 'text/csv'))).toBe(T_DocumentExtension.csv);
		expect(Document.family_of('text/csv', T_DocumentExtension.csv)).toBe(T_DocumentFamily.sheet);
		expect(Document.family_of('text/plain', T_DocumentExtension.csv)).toBe(T_DocumentFamily.sheet);
	});

	it('puts every book ending in the book family', () => {
		for (const ending of ['epub', 'kfx', 'azw3', 'azw4']) {
			const kind = Document.kind_of(dropped(`novel.${ending}`));
			expect(kind).not.toBe(null);
			expect(Document.family_of('', kind)).toBe(T_DocumentFamily.book);
		}
	});

	it('takes in the kinds a browser cannot show — they are saved, just not openable', () => {
		for (const name of ['sheet.csv', 'ledger.qb', 'novel.epub', 'notes.docx', 'clip.avi', 'song.wma']) {
			const kind = Document.kind_of(dropped(name));
			expect(kind).not.toBe(null);
			expect(Document.is_viewable(kind)).toBe(false);
		}
	});

	it('says a table needs no reading out, while a book and an accounting file do', () => {
		expect(Document.status_of(T_DocumentExtension.csv, false)).toBe(S_Document.ready);
		expect(Document.status_of(T_DocumentExtension.epub, false)).toBe(S_Document.quick);
		expect(Document.status_of(T_DocumentExtension.azw3, false)).toBe(S_Document.heavy);
		expect(Document.status_of(T_DocumentExtension.qb, false)).toBe(S_Document.heavy);
	});

	it('lists both new families in the drop box, each with its own endings', () => {
		const families = Document.accepted_families();
		expect(families).toContain(T_DocumentFamily.sheet);
		expect(families).toContain(T_DocumentFamily.book);
		expect(Document.endings_of(T_DocumentFamily.sheet)).toEqual(['csv', 'numbers', 'qb']);
		expect(Document.endings_of(T_DocumentFamily.book)).toEqual(['epub', 'kfx', 'azw3', 'azw4']);
		expect(Document.family_label(T_DocumentFamily.sheet)).toBe('spreadsheet');
		expect(Document.family_label(T_DocumentFamily.book)).toBe('book');
	});

	it('now lists the endings a browser cannot show, where before it hid them', () => {
		expect(Document.endings_of(T_DocumentFamily.text)).toContain('docx');
		expect(Document.endings_of(T_DocumentFamily.video)).toContain('avi');
		expect(Document.endings_of(T_DocumentFamily.audio)).toContain('wma');
	});
});

describe('what can and cannot be shown', () => {
	it('names every kind a browser will not draw', () => {
		for (const kind of ['doc', 'avi', 'flv', 'mkv', 'wmv', 'aiff', 'wma', 'csv', 'qb', 'epub', 'kfx', 'azw3', 'azw4']) {
			expect(UNVIEWABLE_KINDS.has(kind as T_DocumentExtension)).toBe(true);
			expect(Document.is_viewable(kind as T_DocumentExtension)).toBe(false);
		}
	});

	it('keeps the two the model reads as they stand on their own list, still unshowable', () => {
		for (const kind of ['docx', 'mpg']) {
			expect(ACCEPTABLE_UNVIEWABLE.has(kind as T_DocumentExtension)).toBe(true);
			expect(UNVIEWABLE_KINDS.has(kind as T_DocumentExtension)).toBe(false);
			expect(Document.is_viewable(kind as T_DocumentExtension)).toBe(false);
			expect(NEEDS_CONVERTING.has(kind as T_DocumentExtension)).toBe(false);
		}
	});

	it('takes them in and names them among their family\'s endings', () => {
		expect(Document.kind_of(dropped('notes.docx'))).toBe(T_DocumentExtension.docx);
		expect(Document.kind_of(dropped('clip.mpg'))).toBe(T_DocumentExtension.mpg);
		expect(Document.endings_of(T_DocumentFamily.text)).toContain('docx');
		expect(Document.endings_of(T_DocumentFamily.video)).toContain('mpg');
	});

	it('still shows words, web pages, pdfs, pictures, and the clips and sound a browser plays', () => {
		for (const kind of ['txt', 'md', 'rtf', 'html', 'pdf', 'png', 'jpeg', 'svg', 'mp4', 'mov', 'webm', 'mp3', 'wav', 'flac']) {
			expect(Document.is_viewable(kind as T_DocumentExtension)).toBe(true);
		}
	});

	it('counts a folder — no ending at all — as not showable', () => {
		expect(Document.is_viewable(null)).toBe(false);
		expect(Document.is_viewable(undefined)).toBe(false);
	});
});

describe('pdf and web page folded into the text family', () => {
	it('gives a pdf, a web page, a Word file and plain words the one family', () => {
		for (const [type, kind] of [
			['application/pdf', T_DocumentExtension.pdf],
			['text/html', T_DocumentExtension.html],
			['', T_DocumentExtension.docx],
			['text/plain', T_DocumentExtension.txt],
		] as Array<[string, T_DocumentExtension]>) {
			expect(Document.family_of(type, kind)).toBe(T_DocumentFamily.text);
		}
	});

	it('leaves no pdf or web-page family behind, and no word for one', () => {
		const families = Object.values(T_DocumentFamily) as string[];
		expect(families).not.toContain('pdf');
		expect(families).not.toContain('html');
		expect(families.sort()).toEqual(['audio', 'book', 'folder', 'image', 'spreadsheet', 'text', 'video']);
	});

	it('still tells a picture by its ending when the browser reports no type', () => {
		expect(Document.family_of('', T_DocumentExtension.png)).toBe(T_DocumentFamily.image);
		expect(Document.family_of('', T_DocumentExtension.svg)).toBe(T_DocumentFamily.image);
		expect(Document.family_of('', T_DocumentExtension.mp4)).toBe(T_DocumentFamily.video);
		expect(Document.family_of('', T_DocumentExtension.mp3)).toBe(T_DocumentFamily.audio);
	});
});
