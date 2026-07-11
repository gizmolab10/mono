<script lang='ts'>
	// Phase 1 skeleton: a drop target that logs the dropped files. Saving them
	// to the document store lands in a later phase.
	let { onback }: { onback: () => void } = $props();
	let dragging = $state(false);

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		const files = Array.from(event.dataTransfer?.files ?? []);
		const summary = files.map(f => `${f.name} (${f.type || 'unknown type'}, ${f.size} bytes)`).join('; ') || 'none';
		console.log(`Add view: dropped ${files.length} file(s): ${summary}. Not saved yet — persistence lands in a later phase.`);
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
	<button class='back' onclick={onback} aria-label='back to browse'>←</button>

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
		box-sizing : border-box;
		position   : relative;
		height     : 100%;
		width      : 100%;
		padding    : 52px 24px 24px;
	}

	.back {
		position   : absolute;
		top        : 12px;
		left       : 16px;
		background : none;
		border     : none;
		cursor     : pointer;
		font-size  : 22px;
		color      : var(--text);
	}

	.drop {
		box-sizing      : border-box;
		height          : 100%;
		border          : 2px dashed var(--accent);
		border-radius   : 16px;
		align-items     : center;
		justify-content : center;
		display         : flex;
		color           : var(--text);
		font-size       : 1.4em;
		opacity         : 0.6;
	}

	.drop.dragging {
		background : var(--hover);
		opacity    : 1;
	}
</style>
