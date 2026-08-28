<script lang='ts'>
	import { T_Edge, USUAL_GAP, folded_height, gap_above, gap_inside, thickness_of } from '../../ts/utilities/Sectioning';
	import type Action from '../../ts/types/Action';
	import { T_Hit_Target } from '../../ts/types/Hit_Targets';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { hits } from '../../ts/events/Hits';
	import Separator from './Separator.svelte';
	import type { Snippet } from 'svelte';

	// One section of a page: a line across the top, then whatever it holds, with equal gap
	// above and below. Stacks of these make a page — the editor is five of them.
	//
	// The point is that a section owns its own spacing. Nothing inside it, and nothing beside
	// it, sets a margin to line itself up; every fault this replaces came from two places doing
	// their own arithmetic and drifting apart.

	let {
		id,
		edge               = T_Edge.thin,
		gap                = USUAL_GAP,
		onbare             = undefined,
		onhover            = undefined,
		gap_at_foot        = undefined,
		holds_subsections  = false,
		fills_when_bare    = false,
		folded             = false,
		actions            = null,
		bare_says          = '',
		extra_when_folded  = 0,
		accent_when_folded = false,
		contents,
	}: {
		onhover?           : ((over: boolean) => void) | undefined;  // the cursor entered or left the content
		onbare?            : (() => void) | undefined;               // a press landed on the bare background, on nothing that answers for itself
		actions?           : Action[] | null;         // things to sit on the line, each at its own end or middle
		contents           : Snippet;                 // what it shows
		holds_subsections? : boolean;  				  // its content is itself sections, which hold the gap at its own boundaries
		fills_when_bare?   : boolean;                 // its whole background fills while the cursor is on bare space, because a press there does something
		folded?            : boolean;                 // its content is put away, so it holds no gap
		edge?              : T_Edge;                  // what bounds it above: an edge of the view, a hair, or the heavy line
		id                 : string;                  // what this section is called, said once by whoever draws it
		bare_says?         : string;                  // what a press on the bare background would do, shown while the cursor is on it
		gap?               : number;                  // how much it holds above and below its content — one number, both sides; ignored while it holds subsections
		gap_at_foot?       : number;                  // a different number below its content, where the two sides are drawn against different things
		extra_when_folded? : number;                  // more than the one folded height, for the one section that needs it
		accent_when_folded?: boolean;                 // folded, its space takes the accent — the same run of color a stack draws for a fold of its own
	} = $props();

	// Said once here, so the line and the gap can never disagree about what this section is.
	let bar = $derived(thickness_of(edge));
	// Above its contents, half of this section's own line stands inside the gap, so half is given
	// back. Below them, the line that bounds the gap belongs to whatever comes next and is not
	// this section's to give back — so the whole gap is held.
	let gap_under_line = $derived(gap_above(folded, gap, holds_subsections, bar));
	let gap_below = $derived(gap_inside(folded, gap_at_foot ?? gap, holds_subsections));

	// The line carries everything the caller handed it, folded or open. A thing at the middle hangs
	// down past the line, and below a folded section that is a run of accent; its own page-colored
	// pill masks that accent, so it reads as sitting on the line exactly as it does anywhere else.
	let on_the_line = $derived(actions);

	// Folding or opening moves everything below this section, and every rectangle the hits manager
	// holds was measured where its control stood then. They are all asked again once the browser
	// has drawn at the new height.
	$effect(() => {
		folded;
		hits.defer_recalibrate();
	});

</script>

<!-- The line and what it bounds are one thing, so whatever stacks these sections puts its own
     spacing between whole sections rather than between a section's line and its content. -->
<!-- What color this section is standing on is said as a value anything inside it can read — see
     the rule below. Whatever paints itself to mask the line behind it — a word on the line, a name
     above a pill — reads that rather than the page color, so it still matches while the section
     is filled. -->
<div class='section' class:fills={fills_when_bare}>
	<!-- An edge of the view has no line to draw, so nothing is put there at all. -->
	{#if edge !== T_Edge.view}
		<div class='section-bar'>
			<Separator thickness={bar} actions={on_the_line} />
		</div>
	{/if}

	<!-- Folded, the section still stands one gap tall, so the line above never sits on the line
	     below. Open, it holds the same gap above and below whatever it shows.

	     Folded, it also answers the cursor with nothing at all — no fill, no tip, no press, and
	     nothing said to whoever asked to hear about the cursor. What a press there would act on
	     is out of sight, so offering it would be a lie. -->
	<!-- The section itself is a target, of the kind that stands behind controls: anything inside it
	     that answers for itself wins the cursor, and what is left is this section's bare space. So
	     the fill and the press both come from the one manager, and nothing here walks the page
	     asking what was pressed. -->
	<div
		class='section-body'
		class:folded
		class:accented={folded && accent_when_folded}
		class:lit={fills_when_bare && !folded}
		style:padding-top='{gap_under_line}px'
		style:padding-bottom='{gap_below}px'
		style:min-height='{folded ? folded_height(gap, bar, extra_when_folded) : 0}px'
		role='presentation'
		use:hit_target={{ id, type: T_Hit_Target.section, dormant: folded,
			onpress: folded ? undefined : onbare,
			tip: folded || bare_says === '' ? null : bare_says }}
		onmouseenter={() => { if (!folded) { onhover?.(true); } }}
		onmouseleave={() => { onhover?.(false); }}
		onkeyup={() => {}}>
		{#if !folded}{@render contents()}{/if}
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

	/* Folded, its space takes the accent — so a fold outside a stack reads exactly as a fold
	   inside one, which is a run of accent between two lines rather than a gap of page color. */
	.section-body.accented {
		background : var(--accent);
	}

	/* The line's own gap is the separator's; nothing is added here, or the two would disagree. */
	.section-bar {
		flex : 0 0 auto;
	}

	/* It reaches out to the box's own left and right edges and holds that width back as its own
	   step-in, so what it shows stands exactly where it did. The reach is always there, whether
	   or not anything is filled — a reach that arrived with the fill would move the words at the
	   same moment the color changed, and a jump alongside a fade reads as neither. */
	.section-body {
		margin-left    : calc(var(--gap) * -1);
		margin-right   : calc(var(--gap) * -1);
		padding-left   : var(--gap);
		padding-right  : var(--gap);
		flex-direction : column;
		display        : flex;
		flex           : 0 0 auto;
	}

	/* Folded, it stands its own gap tall with nothing in it, and takes the accent — so the fold
	   reads as one band of color between its line and the line below. */
	.section-body.folded {
		position   : relative;
		background : var(--accent);
	}

	/* A hairline down the exact middle of that band, so the fold reads as a line rather than as
	   a stripe of color. Half a pixel, and pulled back half of its own height, which is what puts
	   its middle on the band's middle whatever the band's height turns out to be. */
	.section-body.folded::after {
		background     : var(--black);
		transform      : translateY(-50%);
		pointer-events : none;
		position       : absolute;
		content        : '';
		height         : 0.5px;
		right          : 0;
		left           : 0;
		top            : 50%;
	}


	/* The bare space here does something when pressed, so the whole background fills while the
	   cursor is on it — the only thing the filling changes, so it fades rather than jumping. The
	   stamp comes from the manager, which hands the cursor to a control inside this section before
	   it ever reaches the section itself. */
	.section-body.lit:global([data-hit]) {
		background : var(--hover);
		cursor     : pointer;
	}

	/* And the color it is standing on, said to everything inside it — the line above included,
	   which is why this is on the whole section rather than on the body that carries the stamp. */
	.section.fills:global(:has(> .section-body[data-hit])) {
		--section-bg : var(--hover);
	}
</style>
