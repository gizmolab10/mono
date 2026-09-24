<script lang='ts'>
	import { hits } from '../../ts/common/Core';
	import type { Snippet } from 'svelte';

	// The details column. The page computes its width. It holds whatever the host hands over,
	// given that width, and nothing where the host hands nothing.
	let { width, children }: { width: number; children?: Snippet<[number]> } = $props();

	// The column is given its width from outside, and it changes without the window changing —
	// showing the column, hiding it, or the window growing past where both fit. Everything in it
	// sits somewhere new, so the hits manager is told once the browser has drawn.
	$effect(() => {
		width;
		hits.defer_recalibrate();
	});
</script>

<div class='region details' style:width='{width}px'>
	{@render children?.(width)}
</div>

<style>
	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	/* The column sits on the accent, as ov's does, and what the host hands over paints its own
	   page color where it wants it, as kb's stack does. No gap above: what the host hands over
	   holds its own, as kb's stack does above its first separator. Both decided 13 September 2026. */
	.details {
		margin-top     : calc((var(--gap-big) + var(--gap-tiny)) * -1);
		padding        : 0 var(--gap) var(--gap);
		background     : var(--accent);
		box-sizing     : border-box;
		flex-direction : column;
		display        : flex;
		gap            : 0;
		flex-shrink    : 0;
	}
</style>
