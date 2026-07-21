<script lang='ts'>
	import { w_drop_total } from '../../ts/managers/Dropping';
	import Drop_Status from './Drop_Status.svelte';
	import ToolTip from './ToolTip.svelte';
	import { save_drop } from '../../ts/managers/Drop';
	import { Document } from '../../ts/types/Document';
	import { debug } from '../../ts/common/Debug';

	// The drop box: saves each dropped file (and folder) into the active store,
	// tagged with whatever tags are chosen for this batch. The saving itself lives
	// in the shared Drop module, so a drop anywhere on the documents view saves the
	// same way (just without the chosen tags).

	let dragging = $state(false);

	// Tags chosen for this drop batch — every saved document gets tagged with them.
	let chosen_tags = $state(new Set<string>());

	// What a drop will save, said in plain words — one friendly word per family.
	// Each word carries its own hover text naming just that family's endings, so
	// "does it take my movies?" is answered by hovering "video", not by reading
	// every ending we accept in one breath.
	const families = Document.accepted_families().map((family) => ({
		label   : Document.family_label(family),
		endings : Document.endings_of(family).join('  '),
	}));
	for (const family of families) {
		debug.log(`Drop box: "${family.label}" covers these endings — ${family.endings || 'none'}.`);
	}

	// The family word the cursor is over, and its endings — shown at once by our own
	// hint below it, instead of the browser's own hover text (which waits a second).
	let hint_anchor  = $state<HTMLElement | null>(null);
	let hint_message = $state<string | null>(null);
	function show_hint(element: HTMLElement, endings: string) { hint_anchor = element; hint_message = endings; }
	function hide_hint() { hint_anchor = null; hint_message = null; }

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
	<!-- The edge, drawn rather than bordered: a plain dashed border leaves the dash
	     length to the browser, and this one is 4 on, 2 off. It straddles where the
	     border would sit, and goes solid while a drag is over the box. -->
	<svg class='drop-edge' aria-hidden='true'>
		<rect class='edge-line' x='0' y='0' width='100%' height='100%' />
	</svg>
	drop documents & folders here
	{#if $w_drop_total > 0}
		<!-- while a drop is running, the count stands where the families stand -->
		<span class='types'><Drop_Status /></span>
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span class='types'>({#each families as family}<span class='family'
			onmouseenter={(e) => show_hint(e.currentTarget, family.endings)}
			onmouseleave={hide_hint}>{family.label}</span>{/each})</span>
	{/if}
</div>

<ToolTip message={hint_message} anchor={hint_anchor} />

<style>

	.drop {
		/* documents already insets by --gap; add the rest so all three sides = --gap-fat */
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

	/* Sits half a line-width in from the box's edge, with the stroke straddling
	   that line — so the drawn edge lands exactly where a border would. */
	/* The width and height are spelled out: a drawn shape is a replaced element, so
	   "stretch to all four edges" leaves it at its own built-in size instead. */
	.drop-edge {
		position       : absolute;
		top            : calc(var(--thickness-fat) / 2);
		left           : calc(var(--thickness-fat) / 2);
		width          : calc(100% - var(--thickness-fat));
		height         : calc(100% - var(--thickness-fat));
		overflow       : visible;
		pointer-events : none;
	}

	.edge-line {
		stroke           : var(--accent);
		stroke-width     : var(--thickness-fat);
		stroke-dasharray : 4 2;
		rx               : var(--radius);
		fill             : none;
	}

	.drop.dragging .edge-line {
		stroke-dasharray : none;               /* a whole line while the box is ready to catch */
	}

	.types {
		font-size  : var(--font-label);
		margin-top : var(--gap);
		text-align : center;
	}

	/* Each family word is a pill so the cursor can light it — which is the only hint
	   that hovering it names the file endings. The side room and the rounded corner
	   are always there, never added on hover: room that appears under the cursor
	   would shove the neighboring words sideways. */
	.family {
		border-radius : var(--radius-pill);
		padding       : 0 0.4em 2px;   /* a little room below the text, so the pill stands taller than the word */
		cursor        : default;
	}

	.family:hover {
		color      : var(--black);
		background : var(--bg);
	}

	/* While a drag is over the box, the words stay quiet — nobody reads endings
	   mid-drop, and the box has its own lit state to show it is ready to receive. */
	.drop.dragging .family:hover {
		background : transparent;
		color      : inherit;
	}

	.drop.dragging {
		background : var(--hover);
		opacity    : 1;
	}

</style>
