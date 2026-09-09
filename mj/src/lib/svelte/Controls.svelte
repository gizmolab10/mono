<script lang='ts'>
	import { customizations } from '../ts/common/Customizations';
	import { Edit, technical } from '../ts/common/Gallery';
	import { Hamburger } from '../ts/common/Core';

	// The controls row: always visible, full width, sitting on the accent. The hamburger at its
	// left shows or hides details; the project's name keeps the middle of the whole row. At its
	// right, gallery's edit button, shown while this browser's technical preference says true,
	// whether or not there are pictures yet.
	let { onclick, detailsShown }: { onclick: () => void; detailsShown: boolean } = $props();
</script>

<div class='controls-row layer-controls'>
	<Hamburger id='controls.hamburger' label='show or hide details' onpress={onclick}
		tip={detailsShown ? 'hide details' : 'show details'} />
	<!-- Placed at the middle of the whole row rather than centered in what the hamburger leaves
	     over, so it never drifts as the row's other contents come and go. -->
	<span class='name'>{customizations.name}</span>
	<span class='spacer'></span>
	{#if technical.on}
		<Edit />
	{/if}
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

	.spacer {
		flex : 1;
	}

	.name {
		transform   : translateX(-50%);
		font-size   : var(--font);
		color       : var(--text);
		position    : absolute;
		white-space : nowrap;
		left        : 50%;
	}

	/* How the hamburger looks is the host's: core draws it and it is reached by the class it
	   wears. Named as reaching outside, since core's own file is where the class is. */
	:global(.hamburger-button) {
		color         : var(--text);
		border-radius : var(--radius-tiny);
		background    : transparent;
		position      : relative;
		cursor        : pointer;
		display       : flex;
		border        : none;
		left          : -4px;
	}

	:global(.hamburger-button .hamburger-icon path) {
		stroke-width : var(--thick-faint);
		stroke       : var(--black);
		fill         : currentColor;
	}

	/* The cursor is on it — the stamp comes from the manager, which is the only thing that knows. */
	:global(.hamburger-button[data-hit] .hamburger-icon path) {
		fill : var(--hover);
	}
</style>
