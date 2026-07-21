import { drop_started, drop_captured, drop_finished, drop_asks, drop_tells, T_Keep } from './Dropping';
import { Document, MAX_FILE_BYTES, say_bytes } from '../types/Document';
import { h } from '../database/Databases';
import { debug } from '../common/Debug';

// Saving dropped files and folders into the active store. Shared so both the
// drop box (which tags the batch) and the documents view (a plain drop, no tags)
// save the same way. A folder becomes a do-nothing "folder" document with its
// contents saved and linked under it, all the way down. The "what kind is this
// file / how are its bytes read" logic lives on Document; here we handle the
// browser's drop (reading entries, walking folders) and write to the store.
//
// A drop happens in two passes. The first walks everything without saving, only
// to learn how many things there are, so the strip on screen can say "captured 3
// of 40". The second saves, counting off as it goes. Everything is counted —
// folders, repeats, and files we don't take — so the count always reaches the
// total.

// What one answer to a same-name question applies to: this file, or the rest of
// the drop too. Held for the length of one drop only.
let standing_answer: T_Keep | null = null;

// --- pass one: how many things are in this drop ---------------------------

async function count_entry(entry: FileSystemEntry): Promise<number> {
	if (entry.isFile) { return 1; }
	if (entry.isDirectory) {
		const children = await read_all_entries(entry as FileSystemDirectoryEntry);
		let total = 1;                                          // the folder itself counts
		for (const child of children) { total += await count_entry(child); }
		return total;
	}
	return 0;
}

// --- pass two: saving ------------------------------------------------------

// A name that isn't taken in this place yet: "notes.txt", then "notes.txt (2)",
// "notes.txt (3)", and so on. Used when a person chooses to keep both.
function free_name(name: string): string {
	let n = 2;
	while (h.document_byName(`${name} (${n})`) !== null) { n = n + 1; }
	return `${name} (${n})`;
}

// Save one file as a document, tag it, and — inside a dropped folder — link it
// under that folder. Files we don't take are skipped; a file we already hold is
// handled by the same-name rules below.
async function save_file(file: File, parent_id: string | null, contains: () => string, chosen: Set<string>): Promise<void> {
	const kind = Document.kind_of(file);
	if (kind === null) {
		debug.log(`Skipping "${file.name}" — its type (${file.type || 'unknown'}) is not one we save yet.`);
		drop_captured();
		return;
	}
	// Too big to keep. Say so on the dialog line and wait for OK — a file that
	// vanished without a word would look like a bug, and this is a decision.
	if (file.size > MAX_FILE_BYTES) {
		debug.log(`Refused "${file.name}": ${file.size} bytes is over the ${MAX_FILE_BYTES} byte limit for one file.`);
		await drop_tells(`"${file.name}" is ${say_bytes(file.size)} — the per-file limit is - ${say_bytes(MAX_FILE_BYTES)}.`);
		drop_captured();
		return;
	}

	const from_file = { last_modified_date: file.lastModified, size: file.size, reported_type: file.type };
	// A document is unique by name across the whole store — a name already held
	// anywhere (this folder, another folder, the top level) is the same file.
	const held = h.document_byName(file.name);

	// Nothing by this name here — save it plainly.
	if (held === null) {
		const content = await Document.bytes_of(file, kind);
		const doc = await h.add_document(file.name, kind, content, from_file);
		for (const tag_id of chosen) { h.add_tagging(tag_id, doc.id); }
		if (parent_id) { h.add_document_relationship(contains(), parent_id, doc.id); }
		debug.log(`Saved file "${file.name}" as a ${kind} document${parent_id ? ' inside a folder' : ''}, with ${chosen.size} tag(s).`);
		drop_captured();
		return;
	}

	// Same name and the same last-changed moment: the same file. It is silently
	// ignored — nothing written, nothing removed, no message. The document already
	// in the store is left exactly as it is.
	if (held.last_modified_date === file.lastModified) {
		debug.log(`"${file.name}" is already held with the same date (${new Date(file.lastModified).toISOString()}) — silently ignored, nothing changed.`);
		drop_captured();
		return;
	}

	// Same name, a different moment: only a person can say which one they want.
	let keep = standing_answer;
	if (keep === null) {
		const asked = await drop_asks(
			file.name,
			{ size: held.size, date: held.last_modified_date },
			{ size: file.size, date: file.lastModified },
			true);
		keep = asked.keep;
		if (asked.repeat) { standing_answer = keep; }
		debug.log(`Asked about "${file.name}": stored is ${held.size ?? 'unknown'} bytes from ${held.last_modified_date == null ? 'no date' : new Date(held.last_modified_date).toISOString()}, dropped is ${file.size} bytes from ${new Date(file.lastModified).toISOString()} — chose to keep the ${keep}${asked.repeat ? ', and the same for the rest of this drop' : ''}.`);
	} else {
		debug.log(`"${file.name}" differs from the one held; the standing answer for this drop says keep the ${keep}.`);
	}

	if (keep === T_Keep.old) {
		debug.log(`Left "${file.name}" as it was; the dropped one was thrown away.`);
		drop_captured();
		return;
	}
	const content = await Document.bytes_of(file, kind);
	if (keep === T_Keep.new) {
		await h.replace_document(held, kind, content, from_file);
		drop_captured();
		return;
	}
	// both — the dropped one joins under a numbered name
	const name = free_name(file.name);
	const doc = await h.add_document(name, kind, content, from_file);
	for (const tag_id of chosen) { h.add_tagging(tag_id, doc.id); }
	if (parent_id) { h.add_document_relationship(contains(), parent_id, doc.id); }
	debug.log(`Kept both copies of "${file.name}" — the dropped one is now called "${name}".`);
	drop_captured();
}

// The File behind a dropped file entry (the entry hands it back by callback).
function file_of(entry: FileSystemFileEntry): Promise<File> {
	return new Promise((resolve, reject) => entry.file(resolve, reject));
}

// Every entry directly inside a folder. The reader returns them in batches and
// marks the end with an empty batch, so we read until it runs dry.
function read_all_entries(dir: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
	const reader = dir.createReader();
	const all: FileSystemEntry[] = [];
	return new Promise((resolve, reject) => {
		const read_batch = () => reader.readEntries((batch) => {
			if (batch.length === 0) { resolve(all); return; }
			all.push(...batch);
			read_batch();
		}, reject);
		read_batch();
	});
}

// How many files inside a dropped folder are already held in the folder of that
// name — matched on both the name and the moment last changed, so a file that
// merely shares a name doesn't count. Folders within are not compared: they carry
// no date of their own.
async function matching_files(children: FileSystemEntry[], held_id: string): Promise<number> {
	let matches = 0;
	for (const child of children) {
		if (!child.isFile) { continue; }
		const here = h.document_named(child.name, held_id);
		if (here === null) { continue; }
		const file = await file_of(child as FileSystemFileEntry);
		if (here.last_modified_date === file.lastModified) { matches = matches + 1; }
	}
	return matches;
}

// Which folder a dropped folder's contents should join. A folder by this name may
// already be here: when not one of the files inside matches one already there — by
// name and date both — the two are treated as different folders and a numbered one
// is made. Otherwise it is the same folder, and its contents are worked through by
// the same-name rules and land in the folder that is already there.
async function folder_for(entry: FileSystemDirectoryEntry, parent_id: string | null, contains: () => string, chosen: Set<string>): Promise<string> {
	const held = h.document_named(entry.name, parent_id);
	if (held !== null) {
		const children = await read_all_entries(entry);
		const known = await matching_files(children, held.id);
		if (known > 0) {
			debug.log(`Folder "${entry.name}" is already here, and ${known} of its ${children.length} item(s) match one inside it by name and date — using the folder that is already here.`);
			return held.id;
		}
		const name = free_name(entry.name);
		debug.log(`Folder "${entry.name}" is already here but not one of its ${children.length} item(s) matches by name and date — making a separate folder called "${name}".`);
		const made = h.add_folder(name);
		for (const tag_id of chosen) { h.add_tagging(tag_id, made.id); }
		if (parent_id) { h.add_document_relationship(contains(), parent_id, made.id); }
		return made.id;
	}
	const folder = h.add_folder(entry.name);
	for (const tag_id of chosen) { h.add_tagging(tag_id, folder.id); }
	if (parent_id) { h.add_document_relationship(contains(), parent_id, folder.id); }
	return folder.id;
}

// Save one dropped entry: a file becomes a document; a folder becomes a folder
// document with its files — and any folders within — saved under it, all the way down.
async function save_entry(entry: FileSystemEntry, parent_id: string | null, contains: () => string, chosen: Set<string>): Promise<void> {
	if (entry.isFile) {
		const file = await file_of(entry as FileSystemFileEntry);
		await save_file(file, parent_id, contains, chosen);
		return;
	}
	if (entry.isDirectory) {
		const dir = entry as FileSystemDirectoryEntry;
		const folder_id = await folder_for(dir, parent_id, contains, chosen);
		drop_captured();
		const children = await read_all_entries(dir);
		debug.log(`Folder "${entry.name}": ${children.length} item(s) directly inside; saving each.`);
		for (const child of children) { await save_entry(child, folder_id, contains, chosen); }
	}
}

// Save everything in a drop into the active store, each saved document wearing
// the chosen tags (an empty set for a plain drop). Reads through the entry door
// so folders come through, falling back to the flat file list when it isn't offered.
export async function save_drop(data: DataTransfer | null, chosen: Set<string>): Promise<void> {
	// Reuse the one "contains" link-meaning, made only the first time it's needed.
	let contains_id: string | null = null;
	const contains = () => (contains_id ??= h.predicate_for('contains').id);
	standing_answer = null;                                   // each drop starts with no standing answer

	const entries = Array.from(data?.items ?? [])
		.map((item) => item.webkitGetAsEntry?.())
		.filter((entry): entry is FileSystemEntry => entry != null);
	if (entries.length > 0) {
		let total = 0;
		for (const entry of entries) { total += await count_entry(entry); }
		debug.log(`Dropped ${entries.length} top-level item(s); ${total} thing(s) in all, folders and skips included.`);
		drop_started(total);
		try {
			for (const entry of entries) { await save_entry(entry, null, contains, chosen); }
		} finally {
			drop_finished();
		}
		return;
	}
	const files = Array.from(data?.files ?? []);
	debug.log(`Dropped ${files.length} file(s) (this browser offered no folder entries).`);
	drop_started(files.length);
	try {
		for (const file of files) { await save_file(file, null, contains, chosen); }
	} finally {
		drop_finished();
	}
}
