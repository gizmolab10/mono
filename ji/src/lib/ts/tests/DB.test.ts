import { describe, it, expect, beforeEach } from 'vitest';
import { T_DocumentExtension } from '../types/Document';
import { Hierarchy } from '../managers/Hierarchy';
import { DB_Local } from '../database/DB_Local';

// A tiny in-memory stand-in for browser storage, so the local storage runs
// under a plain node test. A document's bytes live in the blob store, which
// falls back to its own in-memory map when there is no IndexedDB (as in node).
class Mock_Storage {
	private map = new Map<string, string>();
	getItem(key: string): string | null { return this.map.has(key) ? this.map.get(key)! : null; }
	setItem(key: string, value: string): void { this.map.set(key, value); }
	removeItem(key: string): void { this.map.delete(key); }
	clear(): void { this.map.clear(); }
}

// A persistence backend (db, for the bytes) and the tree that owns its records
// (h). A reload is a fresh make() reading the same browser storage.
function make(): { db: DB_Local; h: Hierarchy } {
	const db = new DB_Local();
	const h = new Hierarchy(db);
	h.fetch_all();
	return { db, h };
}

beforeEach(() => {
	(globalThis as any).localStorage = new Mock_Storage();
});

describe('local document store', () => {
	it('saves a document and lists it back after a reload', async () => {
		const { h } = make();
		const doc = await h.add_document('notes.txt', T_DocumentExtension.txt, 'hello');

		// a fresh make reads the same browser storage — the document survives
		const { db: rdb, h: reloaded } = make();
		const listed = reloaded.list_documents();
		expect(listed.map((l) => l.document.name)).toEqual(['notes.txt']);
		expect(await rdb.read_blob(doc.id)).toBe('hello');
	});

	it('finds a document by name in the place it sits, not across the whole store', async () => {
		const { h } = make();
		const top    = await h.add_document('notes.txt', T_DocumentExtension.txt, 'at the top');
		const folder = h.add_folder('trip');
		const inside = await h.add_document('notes.txt', T_DocumentExtension.txt, 'in the folder');
		h.add_document_relationship(h.predicate_for('contains').id, folder.id, inside.id);

		expect(h.document_named('notes.txt', null)?.id).toBe(top.id);          // the one at the top
		expect(h.document_named('notes.txt', folder.id)?.id).toBe(inside.id);  // the one in the folder
		expect(h.document_named('missing.txt', null)).toBeNull();
	});

	it('replacing a document keeps its id, its tags, and its folder', async () => {
		const { db, h } = make();
		const folder = h.add_folder('trip');
		const doc    = await h.add_document('notes.txt', T_DocumentExtension.txt, 'first', { size: 5, last_modified_date: 1000 });
		const red    = h.add_tag('red');
		h.add_tagging(red.id, doc.id);
		h.add_document_relationship(h.predicate_for('contains').id, folder.id, doc.id);

		await h.replace_document(doc, T_DocumentExtension.txt, 'second and longer', { size: 17, last_modified_date: 2000 });

		expect(h.documents.length).toBe(2);                       // the folder and the one document — no second row
		expect(await db.read_blob(doc.id)).toBe('second and longer');
		expect(doc.size).toBe(17);
		expect(doc.last_modified_date).toBe(2000);
		expect(h.indexes.tags_of(doc.id)).toEqual([red.id]);      // its tag survived
		expect(h.document_named('notes.txt', folder.id)?.id).toBe(doc.id);   // still in the folder
	});

	it('filters by tag and reports the untagged', async () => {
		const { h } = make();
		const a = await h.add_document('a.txt', T_DocumentExtension.txt, 'A');
		const b = await h.add_document('b.txt', T_DocumentExtension.txt, 'B');
		const red = h.add_tag('red');
		h.add_tagging(red.id, a.id);

		expect(h.filter_by_tag(red.id).map((d) => d.name)).toEqual(['a.txt']);
		expect(h.untagged().map((d) => d.name)).toEqual(['b.txt']);
		expect(b.id).toBeTruthy();
	});

	it('adds and removes a tag on a document', async () => {
		const { h } = make();
		const doc = await h.add_document('a.txt', T_DocumentExtension.txt, 'A');
		const red = h.add_tag('red');

		h.add_tagging(red.id, doc.id);
		expect(h.filter_by_tag(red.id).map((d) => d.name)).toEqual(['a.txt']);

		h.remove_tagging(red.id, doc.id);
		expect(h.filter_by_tag(red.id)).toHaveLength(0);
		expect(h.untagged().map((d) => d.name)).toEqual(['a.txt']);
	});

	it('orders children by a parent relationship', async () => {
		const { h } = make();
		const parent = await h.add_document('parent', T_DocumentExtension.txt, 'P');
		const first  = await h.add_document('first', T_DocumentExtension.txt, '1');
		const second = await h.add_document('second', T_DocumentExtension.txt, '2');
		const owns = h.add_predicate('parent-of');
		h.add_document_relationship(owns.id, parent.id, first.id);
		h.add_document_relationship(owns.id, parent.id, second.id);

		// parent is a root; children follow in insertion order under it
		const names = h.list_documents().map((l) => l.document.name);
		expect(names).toEqual(['parent', 'first', 'second']);
	});

	it('reports each document depth and its folder chain when walking', async () => {
		const { h } = make();
		const top    = h.add_folder('top');
		const sub    = h.add_folder('sub');
		const deep   = await h.add_document('deep.txt', T_DocumentExtension.txt, 'D');
		const contains = h.predicate_for('contains');
		h.add_document_relationship(contains.id, top.id, sub.id);
		h.add_document_relationship(contains.id, sub.id, deep.id);

		const listed = h.list_documents();
		expect(listed.map((l) => l.document.name)).toEqual(['top', 'sub', 'deep.txt']);
		expect(listed.map((l) => l.depth)).toEqual([0, 1, 2]);
		// the deepest file names its whole folder chain, root-first
		expect(listed[2].ancestor_ids).toEqual([top.id, sub.id]);
	});

	it('lists a thing under every parent — a duplicate shows under its folder and under its original', async () => {
		const { h } = make();
		const folder   = h.add_folder('trip');
		const original = await h.add_document('notes.txt', T_DocumentExtension.txt, 'first');
		const copy     = await h.add_document('notes (2).txt', T_DocumentExtension.txt, 'second');
		const contains = h.predicate_for('contains').id;
		const dup      = h.predicate_for('is-duplicate-of').id;
		h.add_document_relationship(contains, folder.id, copy.id);     // the new item lives in the folder
		h.add_document_relationship(dup, original.id, copy.id);        // and echoes under its original

		const listed = h.list_documents();
		const copy_rows = listed.filter((l) => l.document.id === copy.id);
		expect(copy_rows).toHaveLength(2);                             // shown twice, once per parent
		const home = copy_rows.find((l) => l.ancestor_ids.includes(folder.id))!;
		const echo = copy_rows.find((l) => l.ancestor_ids.includes(original.id))!;
		expect(home.is_echo).toBe(false);                             // the folder place is the solid home
		expect(echo.is_echo).toBe(true);                              // the original place is the lighter echo
		expect(listed.filter((l) => l.document.id === original.id)).toHaveLength(1);   // the original shows once
	});

	it('a loop below a root does not hang the walk', async () => {
		const { h } = make();
		const root = h.add_folder('root');
		const a    = h.add_folder('a');
		const b    = h.add_folder('b');
		const contains = h.predicate_for('contains').id;
		h.add_document_relationship(contains, root.id, a.id);
		h.add_document_relationship(contains, a.id, b.id);
		h.add_document_relationship(contains, b.id, a.id);            // b links back up to a — a loop

		const names = h.list_documents().map((l) => l.document.name);
		expect(names).toEqual(['root', 'a', 'b']);                   // walked down, then stopped at the loop
	});

	it('reuses the one "contains" meaning instead of making duplicates', () => {
		const { h } = make();
		const first  = h.predicate_for('contains');
		const second = h.predicate_for('contains');
		expect(second.id).toBe(first.id);
		expect(h.predicates.filter((p) => p.type === 'contains')).toHaveLength(1);
	});

	it('links the same parent to the same child under one meaning only once', async () => {
		const { h } = make();
		const folder = h.add_folder('trip');
		const doc    = await h.add_document('notes.txt', T_DocumentExtension.txt, 'N');
		const contains = h.predicate_for('contains').id;

		const first  = h.add_document_relationship(contains, folder.id, doc.id);
		const second = h.add_document_relationship(contains, folder.id, doc.id);   // same trio again
		expect(second.id).toBe(first.id);                          // the one that's already there
		expect(h.relationships).toHaveLength(1);
	});

	it('makes one tag per name, and one link per tag-on-document', async () => {
		const { h } = make();
		const doc  = await h.add_document('a.txt', T_DocumentExtension.txt, 'A');
		const red  = h.add_tag('red');
		const red2 = h.add_tag('red');                           // same name again
		expect(red2.id).toBe(red.id);
		expect(h.tags).toHaveLength(1);

		const first  = h.add_tagging(red.id, doc.id);
		const second = h.add_tagging(red.id, doc.id);            // same pair again
		expect(second.id).toBe(first.id);
		expect(h.taggings).toHaveLength(1);
	});

	it('gives every record its own id, whatever its kind', async () => {
		const { h } = make();
		const doc          = await h.add_document('a.txt', T_DocumentExtension.txt, 'A');
		const tag          = h.add_tag('red');
		const tagging      = h.add_tagging(tag.id, doc.id);
		const predicate    = h.predicate_for('contains');
		const folder       = h.add_folder('trip');
		const relationship = h.add_document_relationship(predicate.id, folder.id, doc.id);

		const ids = [doc.id, tag.id, tagging.id, predicate.id, folder.id, relationship.id];
		expect(new Set(ids).size).toBe(ids.length);               // all distinct across kinds
	});

	it('deletes a folder as a subtree — its files, nested folders, links, and bytes all go', async () => {
		const { db, h } = make();
		const top    = h.add_folder('top');
		const inside = await h.add_document('inside.txt', T_DocumentExtension.txt, 'I');
		const sub    = h.add_folder('sub');
		const deep   = await h.add_document('deep.txt',   T_DocumentExtension.txt, 'D');
		await h.add_document('loose.txt', T_DocumentExtension.txt, 'L');   // outside the folder — should survive
		const contains = h.predicate_for('contains');
		h.add_document_relationship(contains.id, top.id, inside.id);
		h.add_document_relationship(contains.id, top.id, sub.id);
		h.add_document_relationship(contains.id, sub.id, deep.id);
		const red = h.add_tag('red');
		h.add_tagging(red.id, deep.id);

		await h.delete_subtree(top.id);

		// only the loose file outside the folder survives
		expect(h.list_documents().map((l) => l.document.name)).toEqual(['loose.txt']);
		expect(await db.read_blob(deep.id)).toBeNull();
		expect(h.relationships).toHaveLength(0);              // every link touching the folder is gone
		expect(h.filter_by_tag(red.id)).toHaveLength(0);      // the deep file's tag link is gone too
	});

	it('erases the whole store — records and bytes gone, stays empty after reload', async () => {
		const { db, h } = make();
		const doc = await h.add_document('wipe.txt', T_DocumentExtension.txt, 'data');
		h.add_tag('keep');

		await h.erase_all();
		expect(h.list_documents()).toHaveLength(0);
		expect(await db.read_blob(doc.id)).toBeNull();

		const { h: reloaded } = make();
		expect(reloaded.list_documents()).toHaveLength(0);
		expect(reloaded.tags).toHaveLength(0);
	});

	it('erasing clears orphan bytes too — bytes with no matching document', async () => {
		const { db, h } = make();
		const kept = await h.add_document('kept.txt', T_DocumentExtension.txt, 'data');
		// a stray byte-entry with no document record — like a save that wrote bytes then failed
		await db.write_blob('orphan-id', 'left behind');
		expect(await db.read_blob('orphan-id')).toBe('left behind');

		await h.erase_all();
		expect(await db.read_blob(kept.id)).toBeNull();       // the tracked document's bytes go
		expect(await db.read_blob('orphan-id')).toBeNull();   // and the orphan the old loop would have missed
	});

	it('deletes a document as a cascade, leaving no orphans', async () => {
		const { db, h } = make();
		const doc = await h.add_document('gone.txt', T_DocumentExtension.txt, 'bye');
		const tag = h.add_tag('keep');
		h.add_tagging(tag.id, doc.id);

		await h.delete_document(doc.id);

		expect(h.list_documents()).toHaveLength(0);
		expect(h.filter_by_tag(tag.id)).toHaveLength(0);
		expect(await db.read_blob(doc.id)).toBeNull();
	});
});
