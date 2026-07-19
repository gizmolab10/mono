import { databases } from '../database/Databases';
import { Document } from '../types/Document';
import { debug } from '../common/Debug';

// Saving dropped files and folders into the active store. Shared so both the
// drop box (which tags the batch) and the documents view (a plain drop, no tags)
// save the same way. A folder becomes a do-nothing "folder" document with its
// contents saved and linked under it, all the way down. The "what kind is this
// file / how are its bytes read" logic lives on Document; here we handle the
// browser's drop (reading entries, walking folders) and write to the store.

// Save one file as a document, tag it, and — inside a dropped folder — link it
// under that folder. Unknown types are skipped.
async function save_file(file: File, parent_id: string | null, contains: () => string, chosen: Set<string>): Promise<void> {
	const kind = Document.kind_of(file);
	if (kind === null) {
		debug.log(`Skipping "${file.name}" — its type (${file.type || 'unknown'}) is not one we save yet.`);
		return;
	}
	const content = await Document.bytes_of(file, kind);
	const doc = await databases.active.add_document(file.name, kind, content, {
		last_modified_date : file.lastModified,
		size               : file.size,
		reported_type      : file.type,
	});
	for (const tag_id of chosen) { databases.active.add_tagging(tag_id, doc.id); }
	if (parent_id) { databases.active.add_document_relationship(contains(), parent_id, doc.id); }
	debug.log(`Saved file "${file.name}" as a ${kind} document${parent_id ? ' inside a folder' : ''}, with ${chosen.size} tag(s).`);
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

// Save one dropped entry: a file becomes a document; a folder becomes a folder
// document with its files — and any folders within — saved under it, all the way down.
async function save_entry(entry: FileSystemEntry, parent_id: string | null, contains: () => string, chosen: Set<string>): Promise<void> {
	if (entry.isFile) {
		const file = await file_of(entry as FileSystemFileEntry);
		await save_file(file, parent_id, contains, chosen);
		return;
	}
	if (entry.isDirectory) {
		const folder = databases.active.add_folder(entry.name);
		for (const tag_id of chosen) { databases.active.add_tagging(tag_id, folder.id); }
		if (parent_id) { databases.active.add_document_relationship(contains(), parent_id, folder.id); }
		const children = await read_all_entries(entry as FileSystemDirectoryEntry);
		debug.log(`Folder "${entry.name}": ${children.length} item(s) directly inside; saving each.`);
		for (const child of children) { await save_entry(child, folder.id, contains, chosen); }
	}
}

// Save everything in a drop into the active store, each saved document wearing
// the chosen tags (an empty set for a plain drop). Reads through the entry door
// so folders come through, falling back to the flat file list when it isn't offered.
export async function save_drop(data: DataTransfer | null, chosen: Set<string>): Promise<void> {
	// Reuse the one "contains" link-meaning, made only the first time it's needed.
	let contains_id: string | null = null;
	const contains = () => (contains_id ??= databases.active.predicate_for('contains').id);

	const entries = Array.from(data?.items ?? [])
		.map((item) => item.webkitGetAsEntry?.())
		.filter((entry): entry is FileSystemEntry => entry != null);
	if (entries.length > 0) {
		debug.log(`Dropped ${entries.length} top-level item(s) (files and/or folders).`);
		for (const entry of entries) { await save_entry(entry, null, contains, chosen); }
		return;
	}
	const files = Array.from(data?.files ?? []);
	debug.log(`Dropped ${files.length} file(s) (this browser offered no folder entries).`);
	for (const file of files) { await save_file(file, null, contains, chosen); }
}
