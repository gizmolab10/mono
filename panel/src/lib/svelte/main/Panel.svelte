<script lang='ts'>
	import { hits, k, start_tips, ToolTip, w_tip } from '../../ts/common/Core';
	import Operation from './Operation.svelte';
	import Controls from './Controls.svelte';
	import Details from './Details.svelte';
	import type { Snippet } from 'svelte';

	// The whole page, as a component a host draws: the controls row across the top, the details
	// column down the left, the operation view filling the rest, and a status line below them
	// while it has words. The host says what goes in each region, holds whether the column is
	// shown, and feeds the cursor to the hits manager itself, once, in its own App.svelte.
	let { name, details_shown, ontoggle, hamburger = true, controls, details, operation, status = '' }: {
		name          : string;                     // what the controls row calls the project, centered in it
		details_shown : boolean;                    // whether the details column is drawn — the host's state
		ontoggle      : () => void;                 // the hamburger was pressed
		hamburger?    : boolean;                    // whether the hamburger is drawn at all; a host with no column to show hides it
		controls?     : Snippet;                    // what sits at the right end of the controls row
		details?      : Snippet<[number]>;          // what the details column holds, given the column's width
		operation?    : Snippet<[number, number]>;  // what the operation view holds, given the view's width and height
		status?       : string;                     // words for the line below the operation view; none draws no line
	} = $props();

	// The one hover-hint watcher for the whole page: an element carrying its own words shows
	// them, drawn by the hint at the bottom of this file.
	$effect(() => start_tips());

	// One number for the margin at the window's four edges and for the space between the two
	// regions, so the drawing and the arithmetic can never disagree.
	const gap = k.gap.normal;

	let width  = $state(Math.max(k.width.normal, window.innerWidth));
	let height = $state(window.innerHeight);

	function take_size() {
		width  = Math.max(k.width.normal, window.innerWidth);
		height = window.innerHeight;
		// Everything on screen has moved, and every rectangle the hits manager holds was measured
		// once. They are asked again after the browser has drawn at the new size.
		hits.defer_recalibrate();
	}

	// How long the drawing of one size is given before the next size is taken. A drag sends a
	// resize every frame, and taking every one made the frames uneven; measured in mj, a draw
	// takes 4 to 21 ms, so fifty a second holds one. No rung of core's is this short.
	const DRAWING = 20;
	let drawing: ReturnType<typeof setTimeout> | null = null;

	// A resize starts the timer, unless one is running. Every resize while it runs is ignored.
	// When it fires, the window's size is taken, whatever it is by then. So a drag is drawn no
	// more often than the timer allows, and its last size is always drawn.
	function handleResize() {
		if (drawing !== null) { return; }
		drawing = setTimeout(() => {
			drawing = null;
			take_size();
		}, DRAWING);
	}

	// Is there room for both the details column (its fixed width) and the content region beside
	// it (its own smallest useful width), with the two outer margins and the one between?
	let room_for_both = $derived(width - gap * 3 >= k.width.small + k.width.big);
	// Too narrow for both: the content region is dropped and details fill the width.
	let details_only  = $derived(details_shown && !room_for_both);
	let details_width = $derived(details_only ? width - gap * 2 : k.width.small - gap * 2);
	// With details hidden, content has the whole width to itself.
	let content_width = $derived(details_shown ? width - details_width - gap * 3 : width - gap * 2);

	// The two boxes are as tall as what the window leaves them: the margins above and below, the
	// controls row and the gap under it, and the status line with its gap while it is drawn, all
	// come off. The row and the line say their own heights, which change only when their contents
	// do, so the boxes' height is known in the same frame as the window's.
	let controls_height = $state(0);
	let status_height   = $state(0);
	let boxes_height    = $derived(height - gap * 3 - controls_height - (status ? status_height + gap : 0));
</script>

<svelte:window onresize={handleResize} />

<div class='app' style:width='{width}px' style:height='{height}px'>
	<Controls onclick={ontoggle} detailsShown={details_shown} {hamburger} {name} right={controls} bind:height={controls_height} />
	<div class='boxes'>
		{#if details_shown}
			<Details width={details_width} children={details} />
		{/if}
		{#if !details_only}
			<Operation width={content_width} height={boxes_height} children={operation} />
		{/if}
	</div>
	<!-- The status line, drawn only while there are words for it. -->
	{#if status}
		<div class='status' bind:clientHeight={status_height}>{status}</div>
	{/if}
</div>

<!-- The one hover hint for the whole page; each element opts in by carrying its own words. -->
<ToolTip message={$w_tip.message} mouseX={$w_tip.x} mouseY={$w_tip.y} appearance={$w_tip.appearance} />

<style>
	.app {
		background     : var(--accent);
		padding        : var(--gap);
		gap            : var(--gap);
		flex-direction : column;
		box-sizing     : border-box;
		position       : fixed;
		display        : flex;
		overflow       : hidden;
		top            : 0;
		left           : 0;
	}

	/* The two side-by-side boxes, below the controls row. */
	.boxes {
		gap        : var(--gap);
		overflow   : visible;
		display    : flex;
		min-height : 0;
		flex       : 1;
	}

	/* The line below the boxes, a region of its own, as tall as its words. */
	.status {
		border-radius : var(--radius);
		background    : var(--bg);
		padding       : 0 var(--gap);
		font-size     : var(--font);
		color         : var(--text);
		flex-shrink   : 0;
	}

	:global(:root) {
		/* The typeface. Not a step on any ladder, so it keeps a name of its own. */
		--family: system-ui, sans-serif;
	}

	:global(body) {
		font-weight : var(--fw);
		font-family : var(--family);
		color       : var(--text);
		user-select : none;
		margin      : 0;
	}

	:global(button, input, select, textarea) {
		font-weight : var(--fw);
		font-family : var(--family);
	}
</style>
