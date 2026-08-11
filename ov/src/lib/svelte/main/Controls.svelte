<script lang='ts'>
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { k } from '../../ts/common/Constants';
	import { tip } from '../../ts/utilities/Tooltip';

	// The controls row: always visible, full width, sitting on the accent. The hamburger at its
	// left shows or hides details; at its right the dispatcher starts over, and the build number
	// beyond it opens the notes.
	let { onclick, detailsShown, buildNumber, onBuildOpen, onRestart, restarting }:
		{ onclick: () => void; detailsShown: boolean; buildNumber: number; onBuildOpen: () => void;
		  onRestart: () => void; restarting: boolean } = $props();

	const size = k.size.big;
	const hamburgerPath = svg_paths.hamburger(size);
</script>

<div class='controls-row layer-controls'>
	<button class='hamburger-button' {onclick} aria-label='toggle details' use:tip={`${detailsShown ? 'hide' : 'show'} details`}>
		<svg class='hamburger-icon' viewBox='0 0 {size} {size}' width={size} height={size}>
			<path d={hamburgerPath} />
		</svg>
	</button>
	<span class='spacer'></span>
	<button class='build-button' onclick={onRestart} disabled={restarting}
		use:tip={'start the dispatcher over, so changed code is the code answering'}>
		{restarting ? 'restarting...' : 'dispatcher'}
	</button>
	<button class='build-button' onclick={onBuildOpen} use:tip={'show build notes'}>
		build {buildNumber}
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

	/* Takes up whatever is left, so the hamburger stays at the left and the two
	   named buttons stay together at the right. */
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

	/* While the dispatcher is starting over there is nothing to press, so it stays white
	   under the pointer and the pointer stays an arrow. */
	.build-button:disabled,
	.build-button:disabled:hover {
		background : var(--white);
		cursor     : default;
	}
</style>
