<script lang='ts'>
	import { w_operation, T_Operation, close_view } from '../../ts/managers/Operations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { Direction } from '../../ts/types/Angle';
	import { k } from '../../ts/common/Core';

	// The controls row: always visible, full width, sitting on the accent. The hamburger at its
	// left shows or hides details; at its right the dispatcher starts over, and the build number
	// beyond it opens the notes.
	let { onclick, detailsShown, buildNumber, onBuildOpen, onRestart, restarting }:
		{ onclick: () => void; detailsShown: boolean; buildNumber: number; onBuildOpen: () => void;
		  onRestart: () => void; restarting: boolean } = $props();

	const size = k.size.big;
	const hamburgerPath = svg_paths.hamburger(size);
	// The way back to the list while a file is open, drawn as the fat triangle the steppers
	// use, pointing left — the direction the list lies in.
	const backPath = svg_paths.fat_polygon(k.size.fat, Direction.left);

	// The hamburger is the first control to hand the whole of itself to the one manager. It says
	// its name, what a press does, and what to show while the cursor is on it — and nothing else:
	// the action makes the target, hands over the rectangle, and stamps the element while it is
	// the one under the cursor. It carries no press handler, no hover rule and no hint of its own.
</script>

<div class='controls-row layer-controls'>
	<button class='hamburger-button' aria-label='toggle details'
		use:hit_target={{ id: 'controls.hamburger', onpress: onclick, tip: `${detailsShown ? 'hide' : 'show'} details` }}>
		<svg class='hamburger-icon' viewBox='0 0 {size} {size}' width={size} height={size}>
			<path d={hamburgerPath} />
		</svg>
	</button>
	{#if $w_operation === T_Operation.edit}
		<button class='back-button' aria-label='resume browsing'
			use:hit_target={{ id: 'controls.back', onpress: close_view, tip: 'resume browsing' }}>
			<svg class='back-icon' viewBox='0 0 {k.size.fat} {k.size.fat}' width={k.size.fat} height={k.size.fat}>
				<path d={backPath} />
			</svg>
		</button>
	{/if}
	<span class='spacer'></span>
	<!-- While it is starting over it answers nothing, so it hands the manager no press and no
	     words — the same as being disabled, said the one way a target can say it. -->
	<button class='build-button' disabled={restarting}
		use:hit_target={{ id: 'controls.dispatcher', onpress: restarting ? undefined : onRestart,
			tip: restarting ? null : 'start the dispatcher over, so changed code is the code answering' }}>
		{restarting ? 'restarting...' : 'dispatcher'}
	</button>
	<button class='build-button'
		use:hit_target={{ id: 'controls.build', onpress: onBuildOpen, tip: 'show build notes' }}>
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

	/* One gap off the hamburger, drawn the way the list draws its pointers — an outline, not a fill. */
	.back-button {
		margin-left : calc(var(--gap-big) * -1);
		background  : transparent;
		cursor      : pointer;
		align-items : center;
		display     : flex;
		border      : none;
		padding     : 0;
	}

	.back-icon path {
		stroke       : var(--black);
		fill         : var(--white);
		stroke-width : 0.7px;
	}

	/* Under the cursor the triangle's own body takes the hover color — the stamp comes from the
	   manager, like every other control's. */
	.back-button:global([data-hit]) .back-icon path {
		fill : var(--hover);
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

	/* The cursor is on it — the stamp comes from the manager, which is the only thing that knows.
	   It is put on the element from outside this file, so it is named as reaching outside. */
	.hamburger-button:global([data-hit]) .hamburger-icon path {
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

	.build-button:global([data-hit]) {
		background : var(--hover);
	}

	/* While the dispatcher is starting over there is nothing to press, so it stays white
	   under the pointer and the pointer stays an arrow. */
	.build-button:disabled,
	.build-button:disabled:global([data-hit]) {
		background : var(--white);
		cursor     : default;
	}
</style>
