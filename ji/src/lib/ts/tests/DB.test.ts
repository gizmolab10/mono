import { describe, it, expect, beforeEach } from 'vitest';
import { T_DocumentKind } from '../types/DB_Records';
import { DB_Local } from '../database/DB_Local';

// A tiny in-memory stand-in for browser storage, so the local storage runs
// under a plain node test. A document's bytes live in the blob store, which
// falls back to its own in-memory map when there is no IndexedDB (as in node).
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
	it('saves a document and lists it back after a reload', async () => {
		const db = new DB_Local();
		db.fetch_all();
		const doc = await db.add_document('notes.txt', T_DocumentKind.txt, 'hello');

		// a fresh storage reads the same browser storage — the document survives
		const reloaded = new DB_Local();
		reloaded.fetch_all();
		const listed = reloaded.list_documents();
		expect(listed.map((l) => l.document.name)).toEqual(['notes.txt']);
		expect(await reloaded.read_blob(doc.id)).toBe('hello');
	});

	it('filters by tag and reports the untagged', async () => {
		const db = new DB_Local();
		db.fetch_all();
		const a = await db.add_document('a.txt', T_DocumentKind.txt, 'A');
		const b = await db.add_document('b.txt', T_DocumentKind.txt, 'B');
		const red = db.add_tag('red');
		db.add_tagging(red.id, a.id);

		expect(db.filter_by_tag(red.id).map((d) => d.name)).toEqual(['a.txt']);
		expect(db.untagged().map((d) => d.name)).toEqual(['b.txt']);
		expect(b.id).toBeTruthy();
	});

	it('adds and removes a tag on a document', async () => {
		const db = new DB_Local();
		db.fetch_all();
		const doc = await db.add_document('a.txt', T_DocumentKind.txt, 'A');
		const red = db.add_tag('red');

		db.add_tagging(red.id, doc.id);
		expect(db.filter_by_tag(red.id).map((d) => d.name)).toEqual(['a.txt']);

		db.remove_tagging(red.id, doc.id);
		expect(db.filter_by_tag(red.id)).toHaveLength(0);
		expect(db.untagged().map((d) => d.name)).toEqual(['a.txt']);
	});

	it('orders children by a parent relationship', async () => {
		const db = new DB_Local();
		db.fetch_all();
		const parent = await db.add_document('parent', T_DocumentKind.txt, 'P');
		const first  = await db.add_document('first', T_DocumentKind.txt, '1');
		const second = await db.add_document('second', T_DocumentKind.txt, '2');
		const owns = db.add_predicate('parent-of');
		db.add_relationship(owns.id, parent.id, first.id);
		db.add_relationship(owns.id, parent.id, second.id);

		// parent is a root; children follow in insertion order under it
		const names = db.list_documents().map((l) => l.document.name);
		expect(names).toEqual(['parent', 'first', 'second']);
	});

	it('reports each document depth and its folder chain when walking', async () => {
		const db = new DB_Local();
		db.fetch_all();
		const top    = await db.add_document('top',    T_DocumentKind.folder, '');
		const sub    = await db.add_document('sub',    T_DocumentKind.folder, '');
		const deep   = await db.add_document('deep.txt', T_DocumentKind.txt, 'D');
		const contains = db.predicate_for('contains');
		db.add_relationship(contains.id, top.id, sub.id);
		db.add_relationship(contains.id, sub.id, deep.id);

		const listed = db.list_documents();
		expect(listed.map((l) => l.document.name)).toEqual(['top', 'sub', 'deep.txt']);
		expect(listed.map((l) => l.depth)).toEqual([0, 1, 2]);
		// the deepest file names its whole folder chain, root-first
		expect(listed[2].ancestor_ids).toEqual([top.id, sub.id]);
	});

	it('reuses the one "contains" meaning instead of making duplicates', () => {
		const db = new DB_Local();
		db.fetch_all();
		const first  = db.predicate_for('contains');
		const second = db.predicate_for('contains');
		expect(second.id).toBe(first.id);
		expect(db.predicates.filter((p) => p.type === 'contains')).toHaveLength(1);
	});

	it('deletes a folder as a subtree — its files, nested folders, links, and bytes all go', async () => {
		const db = new DB_Local();
		db.fetch_all();
		const top    = await db.add_document('top',      T_DocumentKind.folder, '');
		const inside = await db.add_document('inside.txt', T_DocumentKind.txt, 'I');
		const sub    = await db.add_document('sub',      T_DocumentKind.folder, '');
		const deep   = await db.add_document('deep.txt',   T_DocumentKind.txt, 'D');
		await db.add_document('loose.txt', T_DocumentKind.txt, 'L');   // outside the folder — should survive
		const contains = db.predicate_for('contains');
		db.add_relationship(contains.id, top.id, inside.id);
		db.add_relationship(contains.id, top.id, sub.id);
		db.add_relationship(contains.id, sub.id, deep.id);
		const red = db.add_tag('red');
		db.add_tagging(red.id, deep.id);

		await db.delete_subtree(top.id);

		// only the loose file outside the folder survives
		expect(db.list_documents().map((l) => l.document.name)).toEqual(['loose.txt']);
		expect(await db.read_blob(deep.id)).toBeNull();
		expect(db.relationships).toHaveLength(0);              // every link touching the folder is gone
		expect(db.filter_by_tag(red.id)).toHaveLength(0);      // the deep file's tag link is gone too
	});

	it('erases the whole store — records and bytes gone, stays empty after reload', async () => {
		const db = new DB_Local();
		db.fetch_all();
		const doc = await db.add_document('wipe.txt', T_DocumentKind.txt, 'data');
		db.add_tag('keep');

		await db.erase_all();
		expect(db.list_documents()).toHaveLength(0);
		expect(await db.read_blob(doc.id)).toBeNull();

		const reloaded = new DB_Local();
		reloaded.fetch_all();
		expect(reloaded.list_documents()).toHaveLength(0);
		expect(reloaded.tags).toHaveLength(0);
	});

	it('deletes a document as a cascade, leaving no orphans', async () => {
		const db = new DB_Local();
		db.fetch_all();
		const doc = await db.add_document('gone.txt', T_DocumentKind.txt, 'bye');
		const tag = db.add_tag('keep');
		db.add_tagging(tag.id, doc.id);

		await db.delete_document(doc.id);

		expect(db.list_documents()).toHaveLength(0);
		expect(db.filter_by_tag(tag.id)).toHaveLength(0);
		expect(await db.read_blob(doc.id)).toBeNull();
	});
});
