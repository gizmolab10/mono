<script lang='ts'>
	import { w_operation, T_Operation } from '../../ts/managers/Operations';
	import { w_hierarchy } from '../../ts/database/Databases';
	import { w_db_changed } from '../../ts/types/Signal';
	import { w_drop_total } from '../../ts/managers/Dropping';
	import Drop_Status from '../support/Drop_Status.svelte';
	import { save_drop } from '../../ts/managers/Drop';
	import { Document } from '../../ts/types/Document';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	// The drop box: saves each dropped file (and folder) into the active store,
	// tagged with whatever tags are chosen for this batch. The saving itself lives
	// in the shared Drop module, so a drop anywhere on the documents view saves the
	// same way (just without the chosen tags).

	let dragging = $state(false);

	// The close button (top-left) appears only once the store has documents — with an empty store
	// the list it would return to is itself this drop box, so there'd be nowhere to go. Reads the
	// content-changed signal so it appears the moment the first document lands.
	let has_docs = $derived.by(() => {
		void $w_db_changed;   // recompute whenever the store's contents change
		return $w_hierarchy.documents.length > 0;
	});

	// The cross drawing for the close button.
	const crossPath = svg_paths.x_cross(k.size.cross, k.size.cross / 6);

	// Leave the drop box and show the file list.
	function show_files(): void {
		debug.log('Drop box close button clicked — back to the file list.');
		w_operation.set(T_Operation.files);
	}

	// While the drop box is showing, Escape or Enter/Return leaves it for the file list. The
	// listener lives only as long as this view is on screen (it mounts only for the drop operation),
	// so it can't fire from any other view.
	$effect(() => {
		const on_key = (event: KeyboardEvent): void => {
			if (event.key === 'Escape' || event.key === 'Enter') {
				debug.log(`Drop box: "${event.key}" key pressed — back to the file list.`);
				w_operation.set(T_Operation.files);
			}
		};
		window.addEventListener('keydown', on_key);
		return () => window.removeEventListener('keydown', on_key);
	});

	// Tags chosen for this drop batch — every saved document gets tagged with them.
	let chosen_tags = $state(new Set<string>());

	// What a drop will save, said in plain words — one friendly word per family.
	// Each word carries its own hover text naming just that family's endings, so
	// "does it take my movies?" is answered by hovering "video", not by reading
	// every ending we accept in one breath.
	const families = Document.accepted_families().map((family) => ({
		label   : Document.family_label(family),
		endings : Document.endings_of(family).join(', '),
	}));
	for (const family of families) {
		debug.log(`Drop box: "${family.label}" covers these endings — ${family.endings || 'none'}.`);
	}

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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class='drop'
	class:dragging
	ondrop={handleDrop}
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}>
	{#if has_docs}
		<!-- Top-left, a --gap in from the dashed edge: leaves the drop box and shows the file list. -->
		<button class='close' onclick={show_files} aria-label='show the file list' use:tip={'show files'}>
			<svg class='cross' viewBox='0 0 {k.size.cross} {k.size.cross}'>
				<path d={crossPath} fill='none' stroke-width={k.size.cross / 12} stroke-linecap='round' />
			</svg>
		</button>
	{/if}
	<!-- The edge, drawn rather than bordered: a plain dashed border leaves the dash
	     length to the browser, and this one is 4 on, 2 off. It straddles where the
	     border would sit, and goes solid while a drag is over the box. -->
	<svg class='drop-edge' aria-hidden='true'>
		<rect class='edge-line' x='0' y='0' width='100%' height='100%' />
	</svg>
	<!-- Holds the instruction line 30% of the way down, not dead centre. -->
	<div class='top-space'></div>
	drop files & folders here
	{#if $w_drop_total > 0}
		<!-- a line between the instruction above and the running count below -->
		<hr class='drop-divider' />
		<!-- while a drop is running, the count stands where the families stand -->
		<span class='types'><Drop_Status /></span>
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span class='types'>{#each families as family}<span class='family' use:tip={family.endings}>{family.label}</span>{/each}</span>
	{/if}
</div>

<style>

	.drop {
		/* documents already insets by --gap; add the rest so all three sides = --gap-fat */
		opacity         : var(--opacity-drop);
		font-size       : var(--font-drop);
		padding         : var(--pad-view);
		margin          : var(--gap-fat);
		border-radius   : var(--radius);
		background      : var(--white);
		color           : var(--text);
		box-sizing      : border-box;
		justify-content : flex-start;
		position        : relative;
		align-items     : center;
		flex-direction  : column;
		display         : flex;
		flex            : 1;                   /* fill the height so its bottom margin equals the sides */
	}

	/* The close cross, a --gap in from the box's top-left corner (just inside the dashed edge). */
	.close {
		position        : absolute;
		top             : var(--gap);
		left            : var(--gap);
		height          : var(--height-control);
		width           : var(--height-control);
		border          : var(--thickness-normal) solid var(--black);
		border-radius   : var(--radius-percent);
		background      : var(--white);
		box-sizing      : border-box;
		cursor          : pointer;
		align-items     : center;
		justify-content : center;
		display         : flex;
		padding         : 0;
		z-index         : 1;
	}

	.close:hover {
		background : var(--hover);
	}

	.cross {
		width  : var(--size-svg);
		height : var(--size-svg);
	}

	.cross path {
		stroke : var(--black);
	}

	/* Empty space above the instruction, three tenths of the box tall. */
	.top-space {
		height     : 30%;
		flex-shrink : 0;
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

	.drop-divider {
		border     : none;
		border-top : var(--thickness-normal) solid var(--accent);
		margin     : var(--gap) 0 0;
		width      : 100%;
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
