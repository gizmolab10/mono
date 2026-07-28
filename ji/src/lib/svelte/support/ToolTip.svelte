<script lang='ts'>
	// A hover hint that shows the instant the cursor arrives — the browser's own
	// hover text waits about a second first, and that wait can't be shortened, so
	// this is drawn ourselves. Any element can use it: hand it the thing being
	// pointed at and the words to show, and it sits just below that thing. It runs
	// as wide as it needs and only nudges back when it would run off the window's
	// right edge. Passing no message (or no anchor) shows nothing.

	// Two ways to place it: give it the mouse position (`mouseX`/`mouseY`) and it sits
	// centered just under the cursor; or give it the `anchor` element and it sits just below
	// that. Mouse position wins when both are given. Passing no message shows nothing.
	let { message = null, anchor = null, mouseX = null, mouseY = null }:
		{ message?: string | null; anchor?: HTMLElement | null; mouseX?: number | null; mouseY?: number | null } = $props();

	let label = $state<HTMLElement | null>(null);
	let left  = $state(0);
	let top   = $state(0);

	const MARGIN = 8;         // how far to hold off the window's edges
	const BELOW_MOUSE = 20;   // how far under the cursor the tooltip sits, in mouse mode

	const has_mouse = $derived(mouseX != null && mouseY != null);

	// Place it whenever the words, the mouse, or the anchor change. Measured after the label
	// is on the page so its real width is known — that width both centers it under the mouse
	// and decides whether it would spill off the right edge.
	$effect(() => {
		if (message == null || label == null) { return; }
		const own = label.getBoundingClientRect();
		if (has_mouse) {
			// Centered on the cursor, a little below it, pulled back from either window edge.
			let x = (mouseX as number) - own.width / 2;
			x = Math.max(MARGIN, Math.min(x, window.innerWidth - MARGIN - own.width));
			left = x;
			top  = (mouseY as number) + BELOW_MOUSE;
			return;
		}
		if (anchor == null) { return; }
		const at = anchor.getBoundingClientRect();
		let x = at.left - 5;   // sit a touch left of the pointed-at thing
		if (x + own.width > window.innerWidth - MARGIN) {   // would run off the right — pull it back in
			x = Math.max(MARGIN, window.innerWidth - MARGIN - own.width);
		}
		left = x;
		top  = at.bottom + MARGIN / 2;
	});
</script>

{#if message != null && (anchor != null || has_mouse)}
	<div class='tooltip' bind:this={label} style:left='{left}px' style:top='{top}px'>{message}</div>
{/if}

<style>

	.tooltip {
		z-index        : calc(var(--z-frontmost) + 1);   /* above everything, including the pinned frame */
		padding        : calc(var(--gap-tight) - 2.5px) var(--gap);   /* 5px shorter overall */
		box-shadow     : var(--shadow-modal);
		border         : 0.5px solid var(--accent);
		font-size      : var(--font-credit);
		background     : var(--offwhite);
		color          : var(--black);
		white-space    : nowrap;
		position       : fixed;
		pointer-events : none;                           /* never steals the hover from what it names */
		border-radius  : 6px;
	}

</style>
