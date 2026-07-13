<script lang='ts'>
	// A drop target that saves each dropped file into the active document store.
	// Text saves as its plain contents; images and pdfs save as a data-URL (their
	// bytes base64-wrapped), which a picture tag or a pdf frame can show directly.
	// Unknown types are skipped with a message.
	import { databases } from '../../ts/database/Databases';
	import { T_DocumentKind } from '../../ts/database/DB_Records';

	let dragging = $state(false);

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
		console.log(`Dropped ${files.length} file(s).`);
		for (const file of files) {
			const kind = kind_of(file);
			if (kind === T_DocumentKind.unknown) {
				console.log(`Skipping "${file.name}" — its type (${file.type || 'unknown'}) is not one we save yet.`);
				continue;
			}
			const content = await bytes_of(file, kind);
			databases.active.add_document(file.name, kind, content);
			console.log(`Saved "${file.name}" as a ${kind} document (${content.length} character(s) stored).`);
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

<div class='add-view'>
	<div
		class='drop'
		class:dragging
		role='button'
		tabindex='0'
		ondrop={handleDrop}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}>
		drop documents here
	</div>
</div>

<style>
	.add-view {
		/* Top room clears the fixed control cluster (hamburger + segments). */
		box-sizing : border-box;
		position   : relative;
		height     : 100%;
		width      : 100%;
		padding    : var(--pad-view);
	}

	.drop {
		box-sizing      : border-box;
		height          : 100%;
		border          : var(--thickness-fat) dashed var(--accent);
		border-radius   : var(--radius);
		align-items     : center;
		justify-content : center;
		display         : flex;
		color           : var(--text);
		font-size       : var(--font-drop);
		opacity         : var(--opacity-drop);
	}

	.drop.dragging {
		background : var(--hover);
		opacity    : 1;
	}
</style>
