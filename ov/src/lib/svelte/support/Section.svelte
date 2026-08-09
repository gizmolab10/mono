<script lang='ts'>
	import { T_Edge, USUAL_GAP, folded_height, gap_inside, thickness_of } from '../../ts/utilities/Sectioning';
	import Separator from './Separator.svelte';
	import type { Snippet } from 'svelte';

	// One section of a page: a line across the top, then whatever it holds, with equal gap
	// above and below. Stacks of these make a page — the editor is five of them.
	//
	// The point is that a section owns its own spacing. Nothing inside it, and nothing beside
	// it, sets a margin to line itself up; every fault this replaces came from two places doing
	// their own arithmetic and drifting apart.

	let {
		edge               = T_Edge.thin,
		gap                = USUAL_GAP,
		title              = null,
		hovered            = false,
		folded             = false,
		onclick            = undefined,
		onhover            = undefined,
		holds_subsections  = false,
		holds,
	}: {
		holds_subsections? : boolean;       // its content is itself sections, which hold the gap at its own boundaries
		edge?              : T_Edge;                  // what bounds it above: an edge of the view, a hair, or the heavy line
		gap?               : number;                  // how much it holds above and below its content — one number, both sides; ignored while it holds subsections
		title?             : string | null;           // a word sitting on that line
		hovered?           : boolean;                 // force the word's edge on, because a surrounding area says so
		folded?            : boolean;                 // its content is put away, so it holds no gap
		onclick?           : (() => void) | undefined;            // pressing the word, anywhere along the line
		onhover?           : ((over: boolean) => void) | undefined;  // the cursor entered or left the content
		holds              : Snippet;                 // what it shows
	} = $props();

	// Said once here, so the line and the gap can never disagree about what this section is.
	let bar = $derived(thickness_of(edge));
	let holds_gap = $derived(gap_inside(folded, gap, holds_subsections));
</script>

<!-- The line and what it bounds are one thing, so whatever stacks these sections puts its own
     spacing between whole sections rather than between a section's line and its content. -->
<div class='section'>
	<!-- An edge of the view has no line to draw, so nothing is put there at all. -->
	{#if edge !== T_Edge.view}
		<div class='section-bar'>
			<Separator at_left thickness={bar} title={title} {hovered} onclick={onclick ? () => onclick() : undefined}/>
		</div>
	{/if}

	<!-- Folded, the section still stands one gap tall, so the line above never sits on the line
	     below. Open, it holds the same gap above and below whatever it shows. -->
	<div
		class='section-body'
		style:padding-top='{holds_gap}px'
		style:padding-bottom='{holds_gap}px'
		style:min-height='{folded ? folded_height(gap) : 0}px'
		role='presentation'
		onmouseenter={() => onhover?.(true)}
		onmouseleave={() => onhover?.(false)}>
		{#if !folded}{@render holds()}{/if}
	</div>
</div>

<style>
	/* No gap of its own between the line and what it bounds — the gap inside is the body's, and
	   two sources of gap is exactly the fault this piece exists to remove. */
	.section {
		flex-direction : column;
		display        : flex;
		flex           : 0 0 auto;
		gap            : 0;
	}

	/* The line's own gap is the separator's; nothing is added here, or the two would disagree. */
	.section-bar {
		flex : 0 0 auto;
	}

	.section-body {
		flex-direction : column;
		display        : flex;
		flex           : 0 0 auto;
	}
</style>
