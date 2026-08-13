<script lang='ts'>
	import { back_direction, forward_direction, make_holding, shows_mark } from '../../ts/utilities/Stepping';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { tip } from '../../ts/utilities/Tooltip';
	import { k } from '../../ts/common/Constants';

	// Two fat marks that step from one thing to the next. Ordinarily a mark that leads nowhere
	// is simply absent — its absence is the sign there is nothing that way — but asked to show
	// both, the dead one is drawn anyway and left unanswering, so the pair never changes width.
	//
	// Holding a mark down keeps stepping: one step at once, a pause, then a steady patter until
	// it is let go. Each pair keeps its own beat.

	let { can_back = false, can_forward = false, onprev = () => {}, onnext = () => {},
		vertical = false, always_both = false, back_says = 'previous', forward_says = 'next' }:
		{
			can_back?     : boolean;                 // is there anything behind
			can_forward?  : boolean;                 // is there anything ahead
			onprev?       : (repeated?: boolean) => void;   // told whether this is the press or the patter after it
			onnext?       : (repeated?: boolean) => void;
			vertical?     : boolean;                 // runs up-and-down rather than side-to-side
			always_both?  : boolean;                 // draw the one that leads nowhere too, dead to the touch
			back_says?    : string;                  // the hover words for each
			forward_says? : string;
		} = $props();

	// The same fat mark as ji's, turned whichever way this pair runs.
	const SIZE = k.size.normal * 1.1;
	let back_path      = $derived(svg_paths.fat_polygon(SIZE, back_direction(vertical)));
	let next_path      = $derived(svg_paths.fat_polygon(SIZE, forward_direction(vertical)));
	let back_bounds    = $derived(svg_paths.fat_polygon_bounds(SIZE, back_direction(vertical)));
	let next_bounds    = $derived(svg_paths.fat_polygon_bounds(SIZE, forward_direction(vertical)));

	const holding = make_holding();
	$effect(() => holding.stop);        // let go if this leaves the screen mid-hold
</script>

{#snippet mark(live: boolean, path: string, bounds: { minX: number; minY: number; width: number; height: number }, says: string, step: (repeated?: boolean) => void)}
	<button class='step' class:dead={!live} aria-label={says} use:tip={live ? says : false}
		onmousedown={(e) => { e.stopPropagation(); if (live) { holding.start(step); } }}
		onmouseup={holding.stop} onmouseleave={holding.stop}
		onclick={(e) => { e.stopPropagation(); if (live && e.detail === 0) { step(false); } }}>
		<svg overflow='visible' width={bounds.width} height={bounds.height}
			viewBox='{bounds.minX} {bounds.minY} {bounds.width} {bounds.height}'><path d={path} /></svg>
	</button>
{/snippet}

{#if shows_mark(can_back, always_both) || shows_mark(can_forward, always_both)}
	<div class='steppers' class:vertical>
		{#if shows_mark(can_back, always_both)}
			{@render mark(can_back, back_path, back_bounds, back_says, onprev)}
		{/if}
		{#if shows_mark(can_forward, always_both)}
			{@render mark(can_forward, next_path, next_bounds, forward_says, onnext)}
		{/if}
	</div>
{/if}

<style>
	.steppers {
		gap         : var(--gap-tiny);
		align-items : center;
		display     : flex;
		flex-shrink : 0;
	}

	.steppers.vertical {
		flex-direction : column;
	}

	/* White inside with an accent outline, filling to the hover color under the cursor — the
	   same look as the folder triangles. */
	.step {
		background      : transparent;
		cursor          : pointer;
		justify-content : center;
		align-items     : center;
		display         : flex;
		border          : none;
		padding         : 0;
	}

	.step path {
		stroke       : var(--accent);
		fill         : var(--white);
		stroke-width : 1;
	}

	.step:hover path {
		fill : var(--hover);
	}

	/* Drawn only because both were asked for: it leads nowhere, so it is grayed and unanswering. */
	.step.dead {
		cursor : default;
	}

	.step.dead path,
	.step.dead:hover path {
		stroke : var(--lightgray);
		fill   : var(--white);
	}

</style>
