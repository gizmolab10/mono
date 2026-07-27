<script lang='ts'>
	import { w_operation, T_Operation } from '../../ts/managers/Operations';
	import { databases } from '../../ts/database/Databases';
	import { T_Storage } from '../../ts/types/DB_Records';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { k } from '../../ts/common/Constants';
	import { debug } from '../../ts/common/Debug';

	const w_storage = databases.w_storage;

	// The controls row: always visible, full width, accent background. The
	// details-toggle hamburger sits at the left, a segmented control of the
	// operations sits next to it, the title floats between spacers, and a help
	// button anchors the far right. The hamburger click toggles the details region.
	let { onclick, onHelp }: { onclick: () => void; onHelp: () => void } = $props();
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
		if (is_inert(op)) { debug.log(`Controls: "ask" is inert on the "${$w_storage}" store — click ignored.`); return; }
		debug.log(`Controls: clicked "${op}" — was "${$w_operation ?? 'landing'}", now "${op}".`);
		w_operation.set(op);
	}

	function help() {
		debug.log('Help button clicked — opening the help overlay.');
		onHelp();
	}
</script>

<div class='controls-row layer-controls'>
	<button class='hamburger-button' {onclick} aria-label='toggle details'>
		<svg class='hamburger-icon' viewBox='0 0 {size} {size}' width={size} height={size}>
			<path d={hamburgerPath} />
		</svg>
	</button>
	<span class='title'>Intersection</span>
	<span class='spacer'></span>
	<div class='operations'>
		{#each operations as { op, label }}
			<button
				class='segment'
				class:current={$w_operation === op}
				class:inert={is_inert(op)}
				title={op}
				onclick={() => choose(op)}>{label}</button>
		{/each}
	</div>
	<span class='spacer'></span>
	<button class='help' onclick={help} aria-label='help'>?</button>
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
