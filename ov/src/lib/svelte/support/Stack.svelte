<script lang='ts'>
	import type { Stacked } from '../../ts/types/Stacked';
	import { T_Position } from '../../ts/types/Action';
	import type Action from '../../ts/types/Action';
	import { hits } from '../../ts/events/Hits';
	import { k } from '../../ts/common/Constants';
	import Separator from './Separator.svelte';

	// A run of sections, a gap between each pair, a line drawn centred in every gap.
	//
	// The gap belongs here rather than to a section, which is the whole of it: a line standing in
	// the middle of a gap has equal space on both sides by construction, so nothing anywhere
	// subtracts half a thickness. A section can itself be a stack, and its own sections are then
	// subsections; every line on a page stands in some stack's gap.
	//
	// Lines go between sections and nowhere else — never above the first, never below the last.
	// Whatever holds a stack draws its own boundary. A line at an end would have one side, so it
	// could not be centred in anything.

	let {
		gap        = k.gap.normal,
		thickness  = k.thickness.huge,
		leads      = null,
		over       = 0,
		sections,
	}: {
		gap?       : number;             // how far apart two sections stand, said once for all of them
		thickness? : number;             // how thick the line in each gap is drawn
		leads?     : Action[] | null;    // a line above the first section, where whatever holds this stack draws no boundary of its own
		over?      : number;             // how thick the line whatever holds this stack draws above it; nothing, where it draws none
		sections   : Stacked[];          // the sections, in the order they stand
	} = $props();

	// A thing standing at a line's middle hangs above and below that line, unlike a word at an end
	// which is read as riding it. So the gaps on both sides of such a line are widened.
	//
	// Only a thing that was actually built counts. A caller names every thing its line could carry,
	// and hands over nothing where that thing is not there — a clearing pill with nothing to clear.
	function centered(section: Stacked | null): boolean {
		return (section?.rides ?? []).some((one) => one.position === T_Position.center && one.element !== null);
	}

	// How much space stands between this section and whatever is above it. Half of it falls above
	// the line between them and half below, so a line carrying something at its middle takes two
	// big gaps and every other line takes the stack's own.
	function spacing(at: number): number {
		const rides = at === 0 ? { rides: leads } as Stacked : sections[at];
		return centered(rides ?? null) ? k.gap.big * 2 : gap;
	}

	// Where the leading line stands, measured from the stack's own top. Everything here is
	// measured middle to middle, and the middle of the line above sits half its own thickness
	// higher than the stack — so that half comes off, and the two lines stand the same distance
	// apart as every other pair.
	const lead_at = $derived(gap * 1.5 - over / 2);

	// Folding or opening moves everything below, and every rectangle the hits manager holds was
	// measured where its control stood then. They are all asked again once the browser has drawn.
	$effect(() => {
		sections.map((one) => one.folded);
		hits.defer_recalibrate();
	});

	// How far the line above a folded section stands from the line below it, middle to middle. One
	// number for every fold on every page: a fold shows the same band whether it folded one
	// field or a stack of tag rows.
	const FOLDED = k.gap.normal * 2;

	// Where the line above a section stands, measured from that section's own top edge — half the
	// space between them, every one of them. The first section's line is the leading one, and it
	// stands the same half-space above that section as every other line stands above its own.
	function line_at(at: number): number {
		return -spacing(at) / 2;
	}

	// Whether the last section is folded, and whether the one above it is too. Everything about
	// the foot of the stack follows from these two.
	const last_folded = $derived(sections.length > 0 && !!sections[sections.length - 1].folded);
	const both_folded = $derived(last_folded && sections.length > 1 && !!sections[sections.length - 2].folded);

	// The last section folded with the one above it open: that fold needs a line to end against,
	// so the stack closes itself with the heavy one where its band ends. With both folded there is
	// nothing down there to close off — the stack draws none, ends above its last line, and the
	// fold itself shows no band and takes no height.
	const add_end_separator = $derived(last_folded && !both_folded);

	// What the stack leaves below its last section: the faint gap, or a whole gap given back where
	// both of the last two are folded and nothing is left down there to stand clear of.
	const foot_gap = $derived(both_folded ? -k.gap.normal : k.gap.faint);

	// Half the space above a section and half the space below it — the part of each gap that
	// belongs to this section rather than to its neighbour. A section that answers a press reads
	// these and reaches out over them, so the whole slot answers rather than the content alone.
	function over_of(at: number): number {
		return at === 0 ? (leads ? spacing(0) / 2 : 0) : spacing(at) / 2;
	}

	function under_of(at: number): number {
		return at === sections.length - 1 ? Math.max(0, foot_gap) : spacing(at + 1) / 2;
	}

	// A folded section shows nothing, and stands whatever height puts the line below it exactly the
	// folded distance from the line above it. The line below sits half a space up from the next
	// section, which is this section's own height plus the space between them.
	function height_of(at: number): number {
		if (both_folded && at === sections.length - 1) { return 0; }
		return Math.max(0, FOLDED + line_at(at) - spacing(at + 1) / 2);
	}
</script>

<!-- A gap standing in for something folded, taking the accent with a hairline down its exact
     middle — so it reads as a line rather than as a stripe of color. It reaches out to the box's
     own edges, the way every line does. -->
{#snippet band(tall: number, middle: number, haired = true)}
	<div class='band' style:height='{tall}px' style:top='{middle - tall / 2}px'></div>
	{#if haired}<div class='hair' style:top='{middle}px'></div>{/if}
{/snippet}

<!-- A line above the first section, where whatever holds this stack draws no boundary of its own.
     It stands clear of whatever line is drawn there, and the first section stands one space below
     it — the same distance every other section stands from the line above it.

     Nothing is set on the whole run: how far one section stands from the one above it is that
     pair's own, since a line carrying something at its middle takes more space than a plain one. -->
<div class='stack'
	style:padding-top={leads ? `${lead_at + spacing(0) / 2}px` : undefined}
	style:margin-bottom='{foot_gap}px'>
	{#if leads}
		{@render band(lead_at + over / 2, (lead_at - over / 2) / 2)}
		<div class='gap-line' style:top='{lead_at}px'>
			<Separator {thickness} actions={leads} />
		</div>
	{/if}
	{#each sections as section, at (at)}
		<div class='stacked' class:folded={section.folded}
			style:--over='{over_of(at)}px'
			style:--under='{under_of(at)}px'
			style:margin-top={at > 0 ? `${spacing(at)}px` : undefined}
			style:height={section.folded ? `${height_of(at)}px` : undefined}>
			{#if section.folded && !(both_folded && at === sections.length - 1)}
				{@render band(FOLDED, line_at(at) + FOLDED / 2)}
			{/if}
			{#if at > 0}
				<div class='gap-line' style:top='{line_at(at)}px'>
					<Separator {thickness} actions={section.rides ?? null} />
				</div>
			{/if}
			{#if !section.folded}{@render section.holds()}{/if}
		</div>
	{/each}
	{#if add_end_separator}
		<div class='gap-line foot'>
			<Separator thickness={k.thickness.huge} />
		</div>
	{/if}
</div>

<style>
	/* Each pair says how far apart it stands, so nothing is set on the run itself. */
	.stack {
		position       : relative;
		flex           : 0 0 auto;
		flex-direction : column;
		display        : flex;
	}

	/* A section holds a place of its own, since the line above it is measured from its top edge. */
	.stacked {
		position : relative;
		flex     : 0 0 auto;
	}

	/* The line, hung off the section's top edge and pulled back half of its own height — which puts
	   its middle exactly where it was told to stand, whatever it is drawn at.
	   Pulling it back is a transform, and a transform makes a layer of its own, so whatever the line
	   sets inside it cannot rise above anything outside. The layer is said here instead, on the
	   thing that actually stands among the bands. */
	.gap-line {
		z-index   : var(--z-controls);
		transform : translateY(-50%);
		position  : absolute;
		right     : 0;
		left      : 0;
	}

	/* The line the stack add_end_separator itself with, its middle on the stack's own bottom edge. */
	.gap-line.foot {
		transform : translateY(50%);
		top       : auto;
		bottom    : 0;
	}

	/* The accent standing in for what was folded, reaching out to the box's own edges. It is put
	   behind everything: the word riding the line above it hangs down into this space, and a band
	   drawn over that word would cut it in half. */
	.band {
		margin         : 0 calc(var(--gap) * -1);
		z-index        : var(--z-common);
		background     : var(--accent);
		position       : absolute;
		pointer-events : none;
		right          : 0;
		left           : 0;
	}

	/* A hairline down its exact middle, so it reads as a line rather than as a stripe of color.
	   Half a pixel, pulled back half of its own height. */
	.hair {
		margin         : 0 calc(var(--gap) * -1);
		z-index        : var(--z-hideable);
		transform      : translateY(-50%);
		background     : var(--black);
		position       : absolute;
		height         : 0.5px;
		pointer-events : none;
		right          : 0;
		left           : 0;
	}
</style>
