<script lang='ts'>
	import { hits } from '../../ts/common/Core';

	// The details column. The frame computes its width. Empty: nothing sits in it yet.
	let { width }: { width: number } = $props();

	// The column is given its width from outside, and it changes without the window changing —
	// showing the column, hiding it, or the window growing past where both fit. Everything in it
	// sits somewhere new, so the hits manager is told once the browser has drawn.
	$effect(() => {
		width;
		hits.defer_recalibrate();
	});
</script>

<div class='region details' style:width='{width}px'></div>

<style>
	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	/* ov's column sits on the accent and only its stack takes the page color. With nothing in
	   it yet, the whole column takes the page color, so it can be seen at all. */
	.details {
		background     : var(--bg);
		padding        : var(--gap);
		box-sizing     : border-box;
		flex-direction : column;
		display        : flex;
		gap            : 0;
		flex-shrink    : 0;
	}
</style>
