<script lang='ts'>
	// A hover hint that shows the instant the cursor arrives — the browser's own
	// hover text waits about a second first, and that wait can't be shortened, so
	// this is drawn ourselves. Any element can use it: hand it the thing being
	// pointed at and the words to show, and it sits just below that thing. It runs
	// as wide as it needs and only nudges back when it would run off the window's
	// right edge. Passing no message (or no anchor) shows nothing.

	let { message = null, anchor = null }: { message?: string | null; anchor?: HTMLElement | null } = $props();

	let label = $state<HTMLElement | null>(null);
	let left  = $state(0);
	let top   = $state(0);

	const MARGIN = 8;   // how far to hold off the window's edges

	// Place it under the pointed-at thing whenever either the thing or the words
	// change. Measured after the label is on the page so its real width is known —
	// that width is what decides whether it would spill off the right edge.
	$effect(() => {
		if (message == null || anchor == null || label == null) { return; }
		const at = anchor.getBoundingClientRect();
		const own = label.getBoundingClientRect();
		let x = at.left;
		if (x + own.width > window.innerWidth - MARGIN) {   // would run off the right — pull it back in
			x = Math.max(MARGIN, window.innerWidth - MARGIN - own.width);
		}
		left = x;
		top  = at.bottom + MARGIN / 2;
	});
</script>

{#if message != null && anchor != null}
	<div class='tooltip' bind:this={label} style:left='{left}px' style:top='{top}px'>{message}</div>
{/if}

<style>

	.tooltip {
		z-index        : calc(var(--z-frontmost) + 1);   /* above everything, including the pinned frame */
		padding        : var(--gap-tight) var(--gap);
		box-shadow     : var(--shadow-modal);
		font-size      : var(--font-credit);
		background     : var(--lightgray);
		color          : var(--black);
		white-space    : nowrap;
		position       : fixed;
		pointer-events : none;                           /* never steals the hover from what it names */
		border-radius  : 6px;
	}

</style>
