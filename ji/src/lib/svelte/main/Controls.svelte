<script lang='ts'>
	import { w_operation, T_Operation } from '../../ts/managers/Operations';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { databases } from '../../ts/database/Databases';
	import { T_Storage } from '../../ts/types/DB_Records';
	import { tip } from '../../ts/utilities/Tooltip';
	import { k } from '../../ts/common/Constants';
	import { debug } from '../../ts/common/Debug';

	const w_storage = databases.w_storage;

	// The controls row: always visible, full width, accent background. The
	// details-toggle hamburger sits at the left, a segmented control of the
	// operations sits next to it, the title floats between spacers, and a help
	// button anchors the far right. The hamburger click toggles the details region.
	let { onclick, onHelp, detailsShown }: { onclick: () => void; onHelp: () => void; detailsShown: boolean } = $props();
	const size = k.size.hamburger;
	const hamburgerPath = svg_paths.hamburger(size);

	// The operations the user starts directly, in row order. "view" is left out —
	// it only opens when a document is picked from the table, so a segment for it
	// would have nothing to show.
	const operations: { op: T_Operation; label: string }[] = [
		{ op: T_Operation.chat,  label: 'chat' },
		{ op: T_Operation.files, label: 'files' },
		{ op: T_Operation.tags,  label: 'tags' },
	];

	// The "ask" segment only works on the LLM store; on any other store it is inert —
	// no click, no hover — since there is nothing to ask.
	function is_inert(op: T_Operation): boolean {
		return op === T_Operation.chat && $w_storage !== T_Storage.llm;
	}

	// Click a segment to switch to that operation — unless it is the inert "ask".
	function choose(op: T_Operation) {
		if (is_inert(op)) { return; }
		w_operation.set(op);
	}

	function help() {
		onHelp();
	}

	// Where a message started from here is addressed.
	const SENT_TO = 'sand@gizmolab.com';

	/** Start a new message, addressed and otherwise empty. Nothing here is filled in for you. */
	function send() {
		debug.log(`Controls: starting a message to ${SENT_TO}.`);
		window.location.href = `mailto:${SENT_TO}`;
	}

	// Hide the centered title when the row is too narrow to hold it without crowding the
	// hamburger, the operations pill, and the help button. Measured from the real widths on
	// screen — not a fixed break-point — so it reacts to browser zoom and any label change
	// too. When hidden, the title is lifted out of the flow (so it frees its space) but stays
	// on the page, so its own width is still measurable and the decision can't flip-flop.
	let row_el:       HTMLDivElement | undefined;
	let title_el:     HTMLSpanElement | undefined;
	let hamburger_el: HTMLButtonElement | undefined;
	let ops_el:       HTMLDivElement | undefined;
	let help_el:      HTMLButtonElement | undefined;
	let show_title = $state(true);

	function measure() {
		if (!row_el || !title_el || !hamburger_el || !ops_el || !help_el) { return; }
		const style = getComputedStyle(row_el);
		const gap   = parseFloat(style.columnGap || style.gap || '0') || 0;
		const room  = row_el.clientWidth;
		// The fixed pieces plus the title, and the five gaps that sit between the six items
		// (the two flex spacers can shrink to nothing, but their gaps still count).
		const title_w = title_el.offsetWidth;
		const need    = hamburger_el.offsetWidth + title_w + ops_el.offsetWidth + help_el.offsetWidth + gap * 5;
		const fits    = room >= need;
		if (fits !== show_title) {
			show_title = fits;
			debug.log_soon(`Controls title: row ${Math.round(room)}px vs needed ${Math.round(need)}px (hamburger ${hamburger_el.offsetWidth} + title ${title_w} + operations ${ops_el.offsetWidth} + help ${help_el.offsetWidth} + gaps ${Math.round(gap * 5)}) — title ${fits ? 'shown' : 'hidden'}.`);
		}
	}

	// Re-measure whenever the row changes size — a window resize, the details region opening,
	// or a browser zoom all fire this.
	$effect(() => {
		measure();
		if (!row_el) { return; }
		const observer = new ResizeObserver(() => measure());
		observer.observe(row_el);
		return () => observer.disconnect();
	});
</script>

<div class='controls-row layer-controls' bind:this={row_el}>
	<button class='hamburger-button' {onclick} bind:this={hamburger_el} aria-label='toggle details' use:tip={`${detailsShown ? 'hide' : 'show'} details`}>
		<svg class='hamburger-icon' viewBox='0 0 {size} {size}' width={size} height={size}>
			<path d={hamburgerPath} />
		</svg>
	</button>
	<span class='title' class:hidden={!show_title} bind:this={title_el}>Intersection</span>
	<span class='spacer'></span>
	<div class='operations' bind:this={ops_el}>
		{#each operations as { op, label }}
			<button
				class='segment'
				use:tip={`manage ${op}`}
				class:inert={is_inert(op)}
				class:current={$w_operation === op}
				onclick={() => choose(op)}>{label}</button>
		{/each}
	</div>
	<span class='spacer'></span>
	<button class='help' onclick={send} aria-label='send' use:tip={'start a message'}>⤴</button>
	<button class='help' onclick={help} bind:this={help_el} aria-label='help' use:tip={'help'}>?</button>
</div>

<style>
	.controls-row {
		/* A normal top row: items centered, full width, no vertical gap — the row
		   is just as tall as its controls. The frame stacks the panel below it. */
		background      : var(--accent);
		gap             : var(--gap);
		box-sizing      : border-box;
		position        : relative;
		align-items     : center;
		display         : flex;
		width           : 100%;
	}

	/* The two growing spacers that flank the title, pushing it to sit centered in
	   the room left between the operations control and the help button. */
	.spacer {
		flex : 1;
	}

	/* The app name, floating between the spacers. */
	.title {
		color          : var(--text-on-accent);
		font-size      : var(--font-huge);
		white-space    : nowrap;
		pointer-events : none;
	}

	/* Too narrow for the title: lift it out of the flow so it frees its space, but keep it
	   on the page (invisible) so its width can still be measured. */
	.title.hidden {
		position   : absolute;
		visibility : hidden;
	}

	/* One pill with a segment per operation; the active one fills --accent, standing
	   out against the white pill body. */
	.operations {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		font-size     : var(--font-base);
		background    : var(--white);
		box-sizing    : border-box;
		overflow      : hidden;
		border-radius : 999px;
		display       : flex;
		flex-shrink   : 0;
	}

	.segment {
		padding    : var(--pad-control);
		background : transparent;
		color      : var(--text);
		cursor     : pointer;
		border     : none;
	}

	.segment:not(:last-child) {
		border-right : var(--thickness-normal) solid var(--black);
	}

	.segment.current {
		background : var(--accent);
		color      : var(--text-on-accent);
		cursor     : default;
	}

	/* The inert "chat" segment (off the AI store): grayed text, and it does not react. */
	.segment.inert {
		color  : var(--lightgray);
		cursor : default;
	}

	/* Light a segment under the cursor — but not the one already chosen, nor an inert one. */
	.segment:not(.current):not(.inert):hover {
		background : var(--hover);
	}

	.hamburger-button {
		color           : var(--text-on-accent);
		border-radius   : var(--radius-banner);
		background      : transparent;
		position        : relative;
		cursor          : pointer;
		display         : flex;
		border          : none;
		left            : -4px;
	}

	.hamburger-button .hamburger-icon path {
		stroke-width : var(--thickness-faint);
		stroke       : var(--black);
		fill         : currentColor;
	}

	.hamburger-button:hover .hamburger-icon path {
		fill : var(--hover);
	}

	.help {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-percent);
		height        : var(--height-control);
		width         : var(--height-control);
		font-size     : var(--font-base);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		cursor        : pointer;
	}

	.help:hover {
		background : var(--hover);
	}
</style>
