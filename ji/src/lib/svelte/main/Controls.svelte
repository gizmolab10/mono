<script lang='ts'>
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { k } from '../../ts/common/Constants';
	import { debug } from '../../ts/common/Debug';

	// The controls row: always visible, full width, accent background. The
	// details-toggle hamburger sits at the left and a help button at the far right.
	// The click toggles the details region.
	let { onclick }: { onclick: () => void } = $props();
	const size = k.size.hamburger;
	const hamburgerPath = svg_paths.hamburger(size);

	function help() {
		debug.log('Help button clicked — help view is not built yet.');
	}
</script>

<div class='controls-row layer-controls'>
	<button class='hamburger-button' {onclick} aria-label='toggle details'>
		<svg class='hamburger-icon' viewBox='0 0 {size} {size}' width={size} height={size}>
			<path d={hamburgerPath} />
		</svg>
	</button>
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

	.help {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-percent);
		height        : var(--height-control);
		width         : var(--height-control);
		box-sizing    : border-box;
		font-size     : var(--font-base);
		background    : var(--white);
		color         : var(--text);
		cursor        : pointer;
	}

	.help:hover {
		background : var(--hover);
	}
</style>
