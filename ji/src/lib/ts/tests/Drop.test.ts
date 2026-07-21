import { clear_storage } from './Mock_Storage';          // must come first — it stands in for browser storage
import { w_drop_question, w_drop_message, w_drop_total, w_drop_captured, T_Keep } from '../managers/Dropping';
import { describe, it, expect, beforeEach } from 'vitest';
import { databases, h } from '../database/Databases';
import { MAX_FILE_BYTES } from '../types/Document';
import { save_drop } from '../managers/Drop';

// The rules a drop follows, driven the way the screen drives them.
//
// A browser hands a drop over as "entries" — each one says whether it is a file
// or a folder, hands back the file itself, or lists what is inside. Those three
// answers are all the drop asks for, so they are stood in for here.
//
// When the drop has to ask a question it waits on the same shared state the strip
// on screen reads, so a test answers exactly the way a person would.

// --- standing in for what a browser drops ---------------------------------

function file_entry(name: string, text: string, date: number, type = 'text/plain'): FileSystemEntry {
	const file = new File([text], name, { type, lastModified: date });
	return {
		name,
		isFile      : true,
		isDirectory : false,
		file        : (resolve: (f: File) => void) => resolve(file),
	} as unknown as FileSystemEntry;
}

// A file that merely claims to be enormous — no gigabyte is ever built.
function huge_entry(name: string, size: number, date: number): FileSystemEntry {
	const file = { name, size, type: 'video/mp4', lastModified: date };
	return {
		name,
		isFile      : true,
		isDirectory : false,
		file        : (resolve: (f: File) => void) => resolve(file as unknown as File),
	} as unknown as FileSystemEntry;
}

function folder_entry(name: string, children: FileSystemEntry[]): FileSystemEntry {
	return {
		name,
		isFile      : false,
		isDirectory : true,
		// the real reader hands back its contents in batches and marks the end with
		// an empty one, so this does the same: everything, then nothing
		createReader: () => {
			let done = false;
			return {
				readEntries: (resolve: (batch: FileSystemEntry[]) => void) => {
					const batch = done ? [] : children;
					done = true;                             // marked before answering: the answer asks again straight away
					resolve(batch);
				},
			};
		},
	} as unknown as FileSystemEntry;
}

function drop_of(...entries: FileSystemEntry[]): DataTransfer {
	return {
		items: entries.map((entry) => ({ webkitGetAsEntry: () => entry })),
		files: [],
	} as unknown as DataTransfer;
}

// --- standing in for the person answering ---------------------------------

// Answer every question the same way, and count how many were asked.
function answers(keep: T_Keep, repeat = false): { asked: () => number; stop: () => void } {
	let asked = 0;
	const stop = w_drop_question.subscribe((question) => {
		if (question) { asked = asked + 1; question.answer(keep, repeat); }
	});
	return { asked: () => asked, stop };
}

// Press OK on anything the drop says, and keep what it said.
function acknowledges(): { said: () => string[]; stop: () => void } {
	const said: string[] = [];
	const stop = w_drop_message.subscribe((told) => {
		if (told) { said.push(told.message); told.answer(); }
	});
	return { said: () => said, stop };
}

// Watch the counting, which is wiped clean the moment the drop finishes.
function watches_counting(): { total: () => number; captured: () => number; stop: () => void } {
	let total = 0;
	let captured = 0;
	const stop_total    = w_drop_total.subscribe((n) => { if (n > 0) { total = n; } });
	const stop_captured = w_drop_captured.subscribe((n) => { if (n > 0) { captured = n; } });
	return { total: () => total, captured: () => captured, stop: () => { stop_total(); stop_captured(); } };
}

const names = () => h.documents.map((d) => d.name);

beforeEach(() => {
	clear_storage();
	h.fetch_all();
});

describe('dropping files', () => {
	it('saves a dropped file, and counts it', async () => {
		const watch = watches_counting();
		await save_drop(drop_of(file_entry('notes.txt', 'hello', 1000)), new Set());
		watch.stop();

		expect(names()).toEqual(['notes.txt']);
		expect(await databases.active.read_blob(h.documents[0].id)).toBe('hello');
		expect(watch.total()).toBe(1);
		expect(watch.captured()).toBe(1);
	});

	it('drops the same file twice (same name, same date): silently ignored, nothing changed, no question', async () => {
		const reply = answers(T_Keep.both);
		await save_drop(drop_of(file_entry('notes.txt', 'first', 1000)), new Set());
		await save_drop(drop_of(file_entry('notes.txt', 'second', 1000)), new Set());   // same date — the same file
		reply.stop();

		expect(names()).toEqual(['notes.txt']);                      // no second row
		expect(await databases.active.read_blob(h.documents[0].id)).toBe('first');   // the stored one is left untouched
		expect(reply.asked()).toBe(0);                               // same date — nothing to ask
	});

	it('same name, a different date, keeping the one already here throws the dropped one away', async () => {
		await save_drop(drop_of(file_entry('notes.txt', 'first', 1000)), new Set());
		const reply = answers(T_Keep.old);
		await save_drop(drop_of(file_entry('notes.txt', 'second', 2000)), new Set());
		reply.stop();

		expect(reply.asked()).toBe(1);
		expect(names()).toEqual(['notes.txt']);
		expect(await databases.active.read_blob(h.documents[0].id)).toBe('first');
		expect(h.documents[0].last_modified_date).toBe(1000);
	});

	it('keeping the dropped one pours it into the row already there, tags and all', async () => {
		await save_drop(drop_of(file_entry('notes.txt', 'first', 1000)), new Set());
		const held = h.documents[0];
		const red = h.add_tag('red');
		h.add_tagging(red.id, held.id);

		const reply = answers(T_Keep.new);
		await save_drop(drop_of(file_entry('notes.txt', 'second', 2000)), new Set());
		reply.stop();

		expect(names()).toEqual(['notes.txt']);                      // still one row
		expect(h.documents[0].id).toBe(held.id);                  // the very same one
		expect(await databases.active.read_blob(held.id)).toBe('second');
		expect(h.documents[0].last_modified_date).toBe(2000);
		expect(h.indexes.tags_of(held.id)).toEqual([red.id]);     // its tag survived
	});

	it('keeping both gives the dropped one a numbered name', async () => {
		await save_drop(drop_of(file_entry('notes.txt', 'first', 1000)), new Set());
		const reply = answers(T_Keep.both);
		await save_drop(drop_of(file_entry('notes.txt', 'second', 2000)), new Set());
		await save_drop(drop_of(file_entry('notes.txt', 'third', 3000)), new Set());
		reply.stop();

		expect(names()).toEqual(['notes.txt', 'notes.txt (2)', 'notes.txt (3)']);
	});

	it('keeping both records one "is a duplicate of" link — original the parent, meaning reused', async () => {
		await save_drop(drop_of(file_entry('notes.txt', 'first', 1000)), new Set());
		const original = h.document_byName('notes.txt')!;
		const reply = answers(T_Keep.both);
		await save_drop(drop_of(file_entry('notes.txt', 'second', 2000)), new Set());
		await save_drop(drop_of(file_entry('notes.txt', 'third', 3000)), new Set());
		reply.stop();

		const dup = h.predicate_for('is-duplicate-of');
		const copy2 = h.document_byName('notes.txt (2)')!;
		const copy3 = h.document_byName('notes.txt (3)')!;
		const links = h.relationships.filter((r) => r.predicate_id === dup.id);
		expect(links).toHaveLength(2);                                   // one per kept-both, no reverse rows
		expect(h.predicates.filter((p) => p.type === 'is-duplicate-of')).toHaveLength(1);   // meaning reused
		for (const link of links) { expect(link.parent_id).toBe(original.id); }             // original is the parent
		expect(links.map((r) => r.child_id).sort()).toEqual([copy2.id, copy3.id].sort());
	});

	it('"do the same for the rest" answers the rest of that drop without asking again', async () => {
		await save_drop(drop_of(
			file_entry('a.txt', 'A', 1000),
			file_entry('b.txt', 'B', 1000),
			file_entry('c.txt', 'C', 1000)), new Set());

		const reply = answers(T_Keep.old, true);                     // first answer, and stand by it
		await save_drop(drop_of(
			file_entry('a.txt', 'A again', 2000),
			file_entry('b.txt', 'B again', 2000),
			file_entry('c.txt', 'C again', 2000)), new Set());
		reply.stop();

		expect(reply.asked()).toBe(1);                               // asked once, not three times
		expect(names()).toEqual(['a.txt', 'b.txt', 'c.txt']);
		expect(await databases.active.read_blob(h.documents[0].id)).toBe('A');   // all three left as they were
	});

	it('a standing answer does not carry into the next drop', async () => {
		await save_drop(drop_of(file_entry('a.txt', 'A', 1000)), new Set());
		const first = answers(T_Keep.old, true);
		await save_drop(drop_of(file_entry('a.txt', 'A again', 2000)), new Set());
		first.stop();

		const second = answers(T_Keep.old);
		await save_drop(drop_of(file_entry('a.txt', 'A once more', 3000)), new Set());
		second.stop();

		expect(second.asked()).toBe(1);                              // the new drop asks afresh
	});

	it('an ending we do not take is skipped, but still counted', async () => {
		const watch = watches_counting();
		await save_drop(drop_of(
			file_entry('notes.txt', 'hello', 1000),
			file_entry('mystery.zzz', 'who knows', 1000, '')), new Set());
		watch.stop();

		expect(names()).toEqual(['notes.txt']);
		expect(watch.total()).toBe(2);
		expect(watch.captured()).toBe(2);                            // the count still arrives at the total
	});

	it('a file over the limit is refused out loud, counted, and not saved', async () => {
		const heard = acknowledges();
		const watch = watches_counting();
		await save_drop(drop_of(huge_entry('movie.mp4', MAX_FILE_BYTES + 1, 1000)), new Set());
		watch.stop();
		heard.stop();

		expect(names()).toEqual([]);
		expect(heard.said().length).toBe(1);
		expect(heard.said()[0]).toContain('per-file limit');
		expect(watch.captured()).toBe(1);
	});
});

describe('dropping folders', () => {
	it('saves a folder with its contents under it, counting the folder too', async () => {
		const watch = watches_counting();
		await save_drop(drop_of(folder_entry('trip', [
			file_entry('day one.txt', 'walked', 1000),
			file_entry('day two.txt', 'rested', 1000)])), new Set());
		watch.stop();

		expect(names()).toEqual(['trip', 'day one.txt', 'day two.txt']);
		expect(watch.total()).toBe(3);                               // the folder counts as one of them
		expect(watch.captured()).toBe(3);
		const folder = h.documents[0];
		expect(h.indexes.children_of(folder.id).length).toBe(2);
	});

	it('the same folder dropped again joins the one already here', async () => {
		const contents = () => folder_entry('trip', [file_entry('day one.txt', 'walked', 1000)]);
		await save_drop(drop_of(contents()), new Set());
		await save_drop(drop_of(contents()), new Set());

		expect(names()).toEqual(['trip', 'day one.txt']);             // no second folder, no second file
	});

	it('a different folder that shares a name gets a numbered name of its own', async () => {
		await save_drop(drop_of(folder_entry('trip', [file_entry('day one.txt', 'walked', 1000)])), new Set());
		await save_drop(drop_of(folder_entry('trip', [file_entry('other.txt', 'elsewhere', 5000)])), new Set());

		expect(names()).toEqual(['trip', 'day one.txt', 'trip (2)', 'other.txt']);
	});

	it('the same name and date in a different folder is silently ignored — unique by name across the store', async () => {
		await save_drop(drop_of(
			folder_entry('one', [file_entry('notes.txt', 'from one', 1000)]),
			folder_entry('two', [file_entry('notes.txt', 'from two', 1000)])), new Set());

		// the second notes.txt matches the first by name and date, so it is dropped;
		// folder "two" is made but stays empty
		expect(names()).toEqual(['one', 'notes.txt', 'two']);
		expect(h.documents.filter((d) => d.name === 'notes.txt').length).toBe(1);
	});
});
