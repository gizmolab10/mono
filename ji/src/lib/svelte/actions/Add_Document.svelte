<script lang='ts'>
	import { T_DocumentKind, TEXT_KINDS } from '../../ts/types/DB_Records';
	import { databases } from '../../ts/database/Databases';
	import { debug } from '../../ts/common/Debug';

	// A drop target that saves each dropped file into the active document store.
	// Text saves as its plain contents; images and pdfs save as a data-URL (their
	// bytes base64-wrapped), which a picture tag or a pdf frame can show directly.
	// Unknown types are skipped with a message.

	let dragging = $state(false);

	// Tags chosen for this drop batch — every saved file gets tagged with them.
	let chosen = $state(new Set<string>());

	// The file types a drop will save — every kind except the catch-all "unknown".
	const accepted = Object.values(T_DocumentKind)
		.filter((kind) => kind !== T_DocumentKind.unknown)
		.join(', ');

	// Turn a file's reported type into one of our document kinds. The specific
	// text-based types (markdown, html, rtf, svg) must be checked before the
	// plain-text catch-all, or they would be saved as plain text.
	function kind_of(file: File): T_DocumentKind {
		if (file.type === 'text/markdown')                               { return T_DocumentKind.md; }
		if (file.type === 'text/html')                                   { return T_DocumentKind.html; }
		if (file.type === 'application/rtf' || file.type === 'text/rtf') { return T_DocumentKind.rtf; }
		if (file.type === 'application/pdf')                             { return T_DocumentKind.pdf; }
		if (file.type === 'image/svg+xml')                               { return T_DocumentKind.svg; }
		if (file.type.startsWith('text/'))                               { return T_DocumentKind.txt; }
		if (file.type === 'image/jpeg')                                  { return T_DocumentKind.jpeg; }
		if (file.type === 'image/png')                                   { return T_DocumentKind.png; }
		if (file.type === 'image/gif')                                   { return T_DocumentKind.gif; }
		if (file.type === 'image/bmp')                                   { return T_DocumentKind.bmp; }
		if (file.type === 'image/webp')                                  { return T_DocumentKind.webp; }
		if (file.type === 'application/msword')                          { return T_DocumentKind.doc; }
		if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') { return T_DocumentKind.docx; }
		return T_DocumentKind.unknown;
	}

	// Read the bytes we store: plain text for the text kinds, a data-URL for the rest.
	function bytes_of(file: File, kind: T_DocumentKind): Promise<string> {
		if (TEXT_KINDS.has(kind)) { return file.text(); }
		return new Promise<string>((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.readAsDataURL(file);
		});
	}

	// Save one file as a document, tag it with the chosen tags, and — when it sits
	// inside a dropped folder — link it under that folder. Unknown types are skipped.
	async function save_file(file: File, parent_id: string | null, contains: () => string) {
		const kind = kind_of(file);
		if (kind === T_DocumentKind.unknown) {
			debug.log(`Skipping "${file.name}" — its type (${file.type || 'unknown'}) is not one we save yet.`);
			return;
		}
		const content = await bytes_of(file, kind);
		const doc = await databases.active.add_document(file.name, kind, content);
		for (const tag_id of chosen) { databases.active.add_tagging(tag_id, doc.id); }
		if (parent_id) { databases.active.add_relationship(contains(), parent_id, doc.id); }
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

	// Save one dropped entry. A file becomes a document; a folder becomes a
	// do-nothing "folder" document (named for the folder) with its files — and any
	// folders within — saved under it, all the way down.
	async function save_entry(entry: FileSystemEntry, parent_id: string | null, contains: () => string) {
		if (entry.isFile) {
			const file = await file_of(entry as FileSystemFileEntry);
			await save_file(file, parent_id, contains);
			return;
		}
		if (entry.isDirectory) {
			const folder = await databases.active.add_document(entry.name, T_DocumentKind.folder, '');
			for (const tag_id of chosen) { databases.active.add_tagging(tag_id, folder.id); }
			if (parent_id) { databases.active.add_relationship(contains(), parent_id, folder.id); }
			const children = await read_all_entries(entry as FileSystemDirectoryEntry);
			debug.log(`Folder "${entry.name}": ${children.length} item(s) directly inside; saving each.`);
			for (const child of children) { await save_entry(child, folder.id, contains); }
		}
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		// Reuse the one "contains" link-meaning, made only the first time it's needed.
		let contains_id: string | null = null;
		const contains = () => (contains_id ??= databases.active.predicate_for('contains').id);
		// Read the drop through the entry door so folders come through, not just a
		// flat file list. Fall back to the flat files if entries aren't offered.
		const entries = Array.from(event.dataTransfer?.items ?? [])
			.map((item) => item.webkitGetAsEntry?.())
			.filter((entry): entry is FileSystemEntry => entry != null);
		if (entries.length > 0) {
			debug.log(`Dropped ${entries.length} top-level item(s) (files and/or folders).`);
			for (const entry of entries) { await save_entry(entry, null, contains); }
			return;
		}
		const files = Array.from(event.dataTransfer?.files ?? []);
		debug.log(`Dropped ${files.length} file(s) (this browser offered no folder entries).`);
		for (const file of files) { await save_file(file, null, contains); }
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragging = true;
	}

	function handleDragLeave() {
		dragging = false;
	}

</script>

<div class='drop'
	tabindex='0'
	role='button'
	class:dragging
	ondrop={handleDrop}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}>
	drop documents and folders here
	<span class='types'>({accepted})</span>
</div>

<style>

	.drop {
		/* documents already insets by --gap; add the rest so all three sides = --gap-fat */
		border          : var(--thickness-fat) dashed var(--accent);
		margin          : var(--gap) var(--gap) var(--gap);
		opacity         : var(--opacity-drop);
		font-size       : var(--font-drop);
		padding         : var(--pad-view);
		border-radius   : var(--radius);
		background      : var(--white);
		color           : var(--text);
		box-sizing      : border-box;
		position        : relative;
		align-items     : center;
		justify-content : center;
		flex-direction  : column;
		display         : flex;
		flex            : 1;                   /* fill the height so its bottom margin equals the sides */
	}

	.types {
		font-size  : var(--font-label);
		margin-top : var(--gap);
		text-align : center;
	}

	.drop.dragging {
		background : var(--hover);
		opacity    : 1;
	}

</style>
