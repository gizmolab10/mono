import { describe, it, expect } from 'vitest';
import { Document, T_DocumentExtension, T_DocumentFamily,
	UNVIEWABLE_KINDS, ACCEPTABLE_UNVIEWABLE, NEEDS_CONVERTING, ARCHIVE_KINDS } from '../types/Document';

// The rules for deciding what a dropped file is. What each kind then answers — family,
// showable, how ready its words are, words-or-bytes — is checked kind by kind against a
// real file in file.extension.test.ts; this file holds only the awkward calls.

// A dropped file, stood in for: only the three things the deciding reads.
function dropped(name: string, type = ''): File {
	return { name, type, size: 10, lastModified: 0 } as unknown as File;
}

describe('deciding what a dropped file is', () => {
	it('lets the ending beat the reported type: a table saved as plain text is still a table', () => {
		expect(Document.kind_of(dropped('books.csv', 'text/csv'))).toBe(T_DocumentExtension.csv);
		expect(Document.family_of('text/csv', T_DocumentExtension.csv)).toBe(T_DocumentFamily.sheet);
		expect(Document.family_of('text/plain', T_DocumentExtension.csv)).toBe(T_DocumentFamily.sheet);
	});

	it('still tells a picture, a clip and sound by ending when the browser reports no type', () => {
		expect(Document.family_of('', T_DocumentExtension.png)).toBe(T_DocumentFamily.image);
		expect(Document.family_of('', T_DocumentExtension.svg)).toBe(T_DocumentFamily.image);
		expect(Document.family_of('', T_DocumentExtension.mp4)).toBe(T_DocumentFamily.video);
		expect(Document.family_of('', T_DocumentExtension.mp3)).toBe(T_DocumentFamily.audio);
	});

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

	it('leaves no pdf or web-page family behind', () => {
		const families = (Object.values(T_DocumentFamily) as string[]).sort();
		expect(families).toEqual(['audio', 'book', 'folder', 'image', 'spreadsheet', 'text', 'video']);
	});

	it('counts a folder — no ending at all — as not showable', () => {
		expect(Document.is_viewable(null)).toBe(false);
		expect(Document.is_viewable(undefined)).toBe(false);
	});
});

describe('the drop box words', () => {
	it('lists both newer families, each with its own endings', () => {
		const families = Document.accepted_families();
		expect(families).toContain(T_DocumentFamily.sheet);
		expect(families).toContain(T_DocumentFamily.book);
		expect(Document.endings_of(T_DocumentFamily.sheet)).toEqual([
			'csv', 'tsv', 'tab', 'psv', 'dif', 'slk',
			'xls', 'xlsx', 'xlsm', 'xlsb', 'xlt', 'xltx', 'xltm',
			'ods', 'ots', 'gnumeric', 'wk1', 'wk3', 'wk4', 'qpw', 'wb3', 'numbers', 'qb']);
		expect(Document.endings_of(T_DocumentFamily.book)).toEqual(['epub', 'kfx', 'azw3', 'azw4']);
		expect(Document.family_label(T_DocumentFamily.sheet)).toBe('spreadsheet');
		expect(Document.family_label(T_DocumentFamily.book)).toBe('book');
	});

	it('names the five old table kinds on their own list, and treats them like any packed table', () => {
		expect(Array.from(ARCHIVE_KINDS).sort()).toEqual(['qpw', 'wb3', 'wk1', 'wk3', 'wk4']);
		for (const kind of ARCHIVE_KINDS) {
			expect(Document.family_of('', kind)).toBe(T_DocumentFamily.sheet);
			expect(Document.is_viewable(kind)).toBe(false);
			expect(NEEDS_CONVERTING.has(kind)).toBe(true);
		}
	});

	it('now lists the endings a browser cannot show, where before it hid them', () => {
		expect(Document.endings_of(T_DocumentFamily.text)).toContain('docx');
		expect(Document.endings_of(T_DocumentFamily.video)).toContain('avi');
		expect(Document.endings_of(T_DocumentFamily.audio)).toContain('wma');
	});
});

describe('the two lists of what a browser will not draw', () => {
	it('names every kind on the plain one', () => {
		for (const kind of ['doc', 'avi', 'flv', 'mkv', 'wmv', 'aiff', 'wma', 'csv', 'numbers', 'qb', 'epub', 'kfx', 'azw3', 'azw4']) {
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

	it('shows words, web pages, pdfs, pictures, and the clips and sound a browser plays', () => {
		for (const kind of ['txt', 'md', 'rtf', 'html', 'pdf', 'png', 'jpeg', 'svg', 'mp4', 'mov', 'webm', 'mp3', 'wav', 'flac']) {
			expect(Document.is_viewable(kind as T_DocumentExtension)).toBe(true);
		}
	});
});
