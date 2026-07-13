import { describe, it, expect, beforeEach } from 'vitest';
import { DB_Local } from './DB_Local';
import { T_DocumentKind } from './DB_Records';

// A tiny in-memory stand-in for browser storage, so the local backend runs
// under a plain node test.
class Fake_Storage {
	private map = new Map<string, string>();
	getItem(key: string): string | null { return this.map.has(key) ? this.map.get(key)! : null; }
	setItem(key: string, value: string): void { this.map.set(key, value); }
	removeItem(key: string): void { this.map.delete(key); }
	clear(): void { this.map.clear(); }
}

beforeEach(() => {
	(globalThis as any).localStorage = new Fake_Storage();
});

describe('local document store', () => {
	it('saves a document and lists it back after a reload', () => {
		const db = new DB_Local();
		db.fetch_all();
		const doc = db.add_document('notes.txt', T_DocumentKind.text, 'hello');

		// a fresh backend reads the same browser storage — the document survives
		const reloaded = new DB_Local();
		reloaded.fetch_all();
		const listed = reloaded.list_documents();
		expect(listed.map((l) => l.document.name)).toEqual(['notes.txt']);
		expect(reloaded.read_blob(doc.id)).toBe('hello');
	});

	it('filters by tag and reports the untagged', () => {
		const db = new DB_Local();
		db.fetch_all();
		const a = db.add_document('a.txt', T_DocumentKind.text, 'A');
		const b = db.add_document('b.txt', T_DocumentKind.text, 'B');
		const red = db.add_tag('red');
		db.add_tagging(red.id, a.id);

		expect(db.filter_by_tag(red.id).map((d) => d.name)).toEqual(['a.txt']);
		expect(db.untagged().map((d) => d.name)).toEqual(['b.txt']);
		expect(b.id).toBeTruthy();
	});

	it('orders children by a parent relationship', () => {
		const db = new DB_Local();
		db.fetch_all();
		const parent = db.add_document('parent', T_DocumentKind.text, 'P');
		const first  = db.add_document('first', T_DocumentKind.text, '1');
		const second = db.add_document('second', T_DocumentKind.text, '2');
		const owns = db.add_predicate('parent-of');
		db.add_relationship(owns.id, parent.id, first.id);
		db.add_relationship(owns.id, parent.id, second.id);

		// parent is a root; children follow in insertion order under it
		const names = db.list_documents().map((l) => l.document.name);
		expect(names).toEqual(['parent', 'first', 'second']);
	});

	it('deletes a document as a cascade, leaving no orphans', () => {
		const db = new DB_Local();
		db.fetch_all();
		const doc = db.add_document('gone.txt', T_DocumentKind.text, 'bye');
		const tag = db.add_tag('keep');
		db.add_tagging(tag.id, doc.id);

		db.delete_document(doc.id);

		expect(db.list_documents()).toHaveLength(0);
		expect(db.filter_by_tag(tag.id)).toHaveLength(0);
		expect(db.read_blob(doc.id)).toBeNull();
	});
});
