<script lang='ts'>
	import { T_DocumentExtension } from '../../ts/types/Document';
	import { save_drop } from '../../ts/managers/Drop';

	// The drop box: saves each dropped file (and folder) into the active store,
	// tagged with whatever tags are chosen for this batch. The saving itself lives
	// in the shared Drop module, so a drop anywhere on the documents view saves the
	// same way (just without the chosen tags).

	let dragging = $state(false);

	// Tags chosen for this drop batch — every saved document gets tagged with them.
	let chosen_tags = $state(new Set<string>());

	// The file types a drop will save.
	const accepted = Object.values(T_DocumentExtension).join(', ');

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();               // the documents view also handles drops; don't double-save
		dragging = false;
		await save_drop(event.dataTransfer, chosen_tags);
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
		border          : var(--thickness-fat) var(--accent);
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
