<script lang='ts'>
	import { T_DocumentKind } from '../../ts/database/DB_Records';
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

	// Turn a file's reported type into one of our document kinds.
	function kind_of(file: File): T_DocumentKind {
		if (file.type.startsWith('text/'))   { return T_DocumentKind.txt; }
		if (file.type === 'image/jpeg')      { return T_DocumentKind.jpeg; }
		if (file.type === 'image/png')       { return T_DocumentKind.png; }
		if (file.type === 'image/gif')       { return T_DocumentKind.gif; }
		if (file.type === 'image/bmp')       { return T_DocumentKind.bmp; }
		if (file.type === 'application/pdf') { return T_DocumentKind.pdf; }
		return T_DocumentKind.unknown;
	}

	// Read the bytes we store: plain text for a text file, a data-URL for the rest.
	function bytes_of(file: File, kind: T_DocumentKind): Promise<string> {
		if (kind === T_DocumentKind.txt) { return file.text(); }
		return new Promise<string>((resolve) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.readAsDataURL(file);
		});
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		const files = Array.from(event.dataTransfer?.files ?? []);
		debug.log(`Dropped ${files.length} file(s).`);
		for (const file of files) {
			const kind = kind_of(file);
			if (kind === T_DocumentKind.unknown) {
				debug.log(`Skipping "${file.name}" — its type (${file.type || 'unknown'}) is not one we save yet.`);
				continue;
			}
			const content = await bytes_of(file, kind);
			const doc = databases.active.add_document(file.name, kind, content);
			for (const tag_id of chosen) { databases.active.add_tagging(tag_id, doc.id); }
			debug.log(`Saved "${file.name}" as a ${kind} document with ${chosen.size} tag tag(s).`);
		}
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
	drop documents here
	<span class='types'>({accepted})</span>
</div>

<style>

	.drop {
		border          : var(--thickness-fat) dashed var(--accent);
		opacity         : var(--opacity-drop);
		font-size       : var(--font-drop);
		padding         : var(--pad-view);
		border-radius   : var(--radius);
		color           : var(--text);
		box-sizing      : border-box;
		position        : relative;
		align-items     : center;
		justify-content : center;
		flex-direction  : column;
		display         : flex;
		flex            : 1;                   /* fill the height so its bottom margin equals the sides */
		/* documents already insets by --gap; add the rest so all three sides = --gap-fat */
		margin          : 0 calc(var(--gap-fat) - var(--gap)) calc(var(--gap-fat) - var(--gap));
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
