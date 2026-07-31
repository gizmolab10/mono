<script lang='ts'>
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { k } from '../../ts/common/Constants';
	import { tip } from '../../ts/utilities/Tooltip';

	// The controls row: always visible, full width, sitting on the accent. For now it
	// holds one thing — the hamburger at its left, which shows or hides details.
	let { onclick, detailsShown }: { onclick: () => void; detailsShown: boolean } = $props();

	const size = k.size.hamburger;
	const hamburgerPath = svg_paths.hamburger(size);
</script>

<div class='controls-row layer-controls'>
	<button class='hamburger-button' {onclick} aria-label='toggle details' use:tip={`${detailsShown ? 'hide' : 'show'} details`}>
		<svg class='hamburger-icon' viewBox='0 0 {size} {size}' width={size} height={size}>
			<path d={hamburgerPath} />
		</svg>
	</button>
</div>

<style>
	.controls-row {
		/* A normal top row: items centered, full width, no vertical gap — the row
		   is just as tall as its controls. The frame stacks the two boxes below it. */
		background  : var(--accent);
		gap         : var(--gap);
		box-sizing  : border-box;
		position    : relative;
		align-items : center;
		display     : flex;
		width       : 100%;
	}

	.hamburger-button {
		color         : var(--text-on-accent);
		border-radius : var(--radius-banner);
		background    : transparent;
		position      : relative;
		cursor        : pointer;
		display       : flex;
		border        : none;
		left          : -4px;
	}

	.hamburger-button .hamburger-icon path {
		stroke-width : var(--thickness-faint);
		stroke       : var(--black);
		fill         : currentColor;
	}

	.hamburger-button:hover .hamburger-icon path {
		fill : var(--hover);
	}
</style>
