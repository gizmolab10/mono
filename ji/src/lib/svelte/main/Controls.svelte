<script lang='ts'>
	import { T_Operation, w_operation } from '../../ts/managers/Operations';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { k } from '../../ts/common/Constants';

	// The controls row: always visible, full width, accent background. The
	// details-toggle hamburger sits at the left, the operation segments centered,
	// and a help button at the far right. The click toggles the details region.
	let { onclick }: { onclick: () => void } = $props();
	const size = k.size.hamburger;
	const hamburgerPath = svg_paths.hamburger(size);

	// Each value is both the label and the stored/compared value.
	const operations = Object.entries(T_Operation) as [string, T_Operation][];

	function help() {
		console.log('Help button clicked — help view is not built yet.');
	}
</script>

<div class='controls-row layer-controls'>
	<button class='hamburger-button' {onclick} aria-label='toggle details'>
		<svg class='hamburger-icon' viewBox='0 0 {size} {size}' width={size} height={size}>
			<path d={hamburgerPath} />
		</svg>
	</button>
	<div class='add-label'>
		Add a new
		<div class='operation'>
			{#each operations as [name, op]}
				<button
					class='segment'
					class:current={$w_operation === op}
					onclick={() => w_operation.set($w_operation === op ? null : op)}>{name}</button>
			{/each}
		</div>
	</div>

	<button class='help' onclick={help} aria-label='help'>?</button>
</div>

<style>
	.controls-row {
		/* A normal top row: items centered, full width, no vertical gap — the row
		   is just as tall as its controls. The frame stacks the panel below it. */
		background      : var(--accent);
		justify-content : space-between;
		box-sizing      : border-box;
		align-items     : center;
		display         : flex;
		width           : 100%;
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

	/* "Add a new" sits right beside the pill — just a word-space, no wide gap. */
	.add-label {
		gap         : var(--gap-tight);
		font-size   : var(--font-base);
		align-items : center;
		display     : flex;
	}

	/* One pill with a segment per operation; the current segment fills --bg. */
	.operation {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-base);
		background    : var(--white);
		overflow      : hidden;
		display       : flex;
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
		background : var(--bg);
	}

	.segment:hover {
		background : var(--hover);
	}

	.help {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-percent);
		height        : var(--height-control);
		width         : var(--height-control);
		font-size     : var(--font-base);
		background    : var(--white);
		color         : var(--text);
		cursor        : pointer;
	}

	.help:hover {
		background : var(--hover);
	}
</style>
