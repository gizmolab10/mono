<script lang='ts'>
	import { Hamburger } from '../../ts/common/Core';
	import type { Snippet } from 'svelte';

	// The controls row: always visible, full width, sitting on the accent. The hamburger at its
	// left shows or hides details; the project's name keeps the middle of the whole row; whatever
	// the host hands over takes the rest of the row, one gap off the hamburger, and sits at the
	// row's right end when it is narrower than that.
	let { onclick, detailsShown, hamburger = true, name, right, height = $bindable(0) }: {
		onclick      : () => void;   // the hamburger was pressed
		detailsShown : boolean;      // whether the details column is drawn, for the hamburger's hint
		hamburger?   : boolean;      // whether the hamburger is drawn at all
		name         : string;       // what the row calls the project
		right?       : Snippet;      // what sits at the right end of the row
		height?      : number;       // how tall the row is, handed back so the page can size what is below it
	} = $props();
</script>

<div class='controls-row layer-controls' bind:clientHeight={height}>
	{#if hamburger}
		<Hamburger id='controls.hamburger' label='show or hide details' onpress={onclick}
			tip={detailsShown ? 'hide details' : 'show details'} />
	{/if}
	<!-- Placed at the middle of the whole row rather than centered in what the hamburger leaves
	     over, so it never drifts as the row's other contents come and go. -->
	<span class='name'>{name}</span>
	<!-- The rest of the row is the host's. A spacer here would share the width with what the host
	     hands over, and a host whose row grows, as kb's does, would start halfway across. -->
	<span class='right'>{@render right?.()}</span>
</div>

<style>
	.controls-row {
		/* A normal top row: items centered, full width, no vertical gap — the row
		   is just as tall as its controls. The page stacks the two boxes below it. */
		background  : var(--accent);
		gap         : var(--gap);
		box-sizing  : border-box;
		position    : relative;
		align-items : center;
		display     : flex;
		width       : 100%;
	}

	/* What the host hands over: the whole of the row past the hamburger, its contents at the right
	   end unless they grow to fill it. */
	.right {
		flex            : 1 1 auto;
		justify-content : flex-end;
		align-items     : center;
		display         : flex;
		min-width       : 0;
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
		border-radius : var(--radius-tiny);
		background    : transparent;
		color         : var(--text);
		position      : relative;
		cursor        : pointer;
		display       : flex;
		border        : none;
		left          : -4px;
	}

	:global(.hamburger-button .hamburger-icon path) {
		stroke-width : var(--thick-micro);
		stroke       : var(--black);
		fill         : currentColor;
	}

	/* The cursor is on it — the stamp comes from the manager, which is the only thing that knows. */
	:global(.hamburger-button[data-hit] .hamburger-icon path) {
		fill : var(--hover);
	}
</style>
