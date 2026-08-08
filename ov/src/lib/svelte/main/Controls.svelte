<script lang='ts'>
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { k } from '../../ts/common/Constants';
	import { tip } from '../../ts/utilities/Tooltip';

	// The controls row: always visible, full width, sitting on the accent. The hamburger
	// at its left shows or hides details; the build number at its right opens the notes.
	let { onclick, detailsShown, buildNumber, onBuildOpen }:
		{ onclick: () => void; detailsShown: boolean; buildNumber: number; onBuildOpen: () => void } = $props();

	const size = k.size.big;
	const hamburgerPath = svg_paths.hamburger(size);
</script>

<div class='controls-row layer-controls'>
	<button class='hamburger-button' {onclick} aria-label='toggle details' use:tip={`${detailsShown ? 'hide' : 'show'} details`}>
		<svg class='hamburger-icon' viewBox='0 0 {size} {size}' width={size} height={size}>
			<path d={hamburgerPath} />
		</svg>
	</button>
	<button class='build-button' onclick={onBuildOpen} use:tip={'show build notes'}>
		build {buildNumber}
	</button>
	<span class='spacer'></span>
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
		border-radius : var(--radius-tiny);
		background    : transparent;
		position      : relative;
		cursor        : pointer;
		display       : flex;
		border        : none;
		left          : -4px;
	}

	.hamburger-button .hamburger-icon path {
		stroke-width : var(--thick-faint);
		stroke       : var(--black);
		fill         : currentColor;
	}

	.hamburger-button:hover .hamburger-icon path {
		fill : var(--hover);
	}

	/* Takes up whatever is left, so the two buttons stay together at the left. */
	.spacer {
		flex : 1;
	}

	.build-button {
		border        : var(--thick) solid var(--black);
		height        : var(--height);
		padding       : var(--pad-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font);
		background    : var(--white);
		color         : var(--gray);
		box-sizing    : border-box;
		cursor        : pointer;
	}

	.build-button:hover {
		background : var(--hover);
	}
</style>
