<script lang='ts'>
	import type { Stacked } from '../../ts/types/Stacked';
	import { T_Position } from '../../ts/types/Action';
	import type Action from '../../ts/types/Action';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import { hits } from '../../ts/events/Hits';
	import Separator from './Separator.svelte';

	// A run of sections, a gap between each pair, a line drawn centred in every gap.
	//
	// The gap belongs here rather than to a section, which is the whole of it: a line standing in
	// the middle of a gap has equal space on both sides by construction, so nothing anywhere
	// subtracts half a thickness. A section can itself be a stack, and its own sections are then
	// subsection; every line on a page stands in some stack's gap.
	//
	// Lines go between sections and nowhere else — never above the first, never below the last.
	// Whatever subsection a stack draws its own boundary. A line at an end would have one side, so it
	// could not be centred in anything.

	let {
		thickness  = k.thickness.huge,
		gap        = k.gap.normal,
		leads      = null,
		closes     = true,
		over       = 0,
		sections,
	}: {
		thickness? : number;             // how thick the separator in each gap is drawn
		gap?       : number;             // how far apart two sections stand, said once for all of them
		over?      : number;             // how thick the separator is that whatever holds this stack draws above it; nothing, where it draws none
		closes?    : boolean;            // whether the stack may draw a separator of its own at the foot; false where whatever holds it draws every boundary down there
		sections   : Stacked[];          // the sections, in the order they stand
		leads?     : Action[] | null;    // a separator above the first section, where whatever holds this stack draws no boundary of its own
	} = $props();

	// A thing standing at a line's middle hangs above and below that line, unlike a word at an end
	// which is read as riding it. So the gaps on both sides of such a line are widened.
	//
	// Only a thing that was actually built counts. A caller names every thing its line could carry,
	// and hands over nothing where that thing is not there — a clearing pill with nothing to clear.
	function centered(section: Stacked | null): boolean {
		return (section?.rides ?? []).some((one) => one.position === T_Position.center && one.element !== null);
	}

	// How much space stands between this section and whatever is above it, middle to middle. The
	// separator's own body stands in the middle of that space, so its thickness is added on: the
	// gap a caller asks for is the empty space it sees on each side, never the distance between
	// two middles with a bar drawn across it.
	//
	// A separator carrying something at its middle takes two big gaps, since that thing hangs past
	// the separator on both sides; every other one takes the stack's own gap.
	function spacing(at: number): number {
		const rides = at === 0 ? { rides: leads } as Stacked : sections[at];
		return (centered(rides ?? null) ? k.gap.fat : gap) + thickness;
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

	// What this stack settled on, every time a fold moves: how many sections, which of them are
	// folded, how far apart the pairs stand, and whether it closes itself at the foot.
	$effect(() => {
		const folds = sections.map((one, at) => `${at}${one.folded ? ' folded' : ' open'}`).join(', ');
		const bands = sections.map((one, at) => one.folded
			? `${at} folded ${height_of(at).toFixed(2)} tall, its separator at ${line_at(at).toFixed(2)} and the next ${FOLDED.toFixed(2)} below it`
			: `${at} open`).join('; ');
		debug.log(`Stack of ${sections.length}: ${folds}. Gap ${gap.toFixed(2)}, spacings [${sections.map((_, at) => spacing(at).toFixed(2)).join(', ')}], leading line ${leads ? `${lead_at.toFixed(2)} down under a ${over.toFixed(2)}-thick one` : 'none'}, closing separator ${add_end_separator ? 'drawn' : 'not drawn'}. Folds: ${bands}.`);
	});

	// TEMPORARY — where every line and every accent actually ended up on the page, read back off
	// the browser once it has drawn, so what was asked for can be set beside what was done.
	let mine = $state<HTMLElement | null>(null);

	$effect(() => {
		sections.map((one) => one.folded);
		const box = mine;
		if (!box) { return; }
		requestAnimationFrame(() => {
			const top = box.getBoundingClientRect().top;
			const said = (what: string) => Array.from(box.querySelectorAll(what)).map((one) => {
				const its = (one as HTMLElement).getBoundingClientRect();
				return `${(its.top + its.height / 2 - top).toFixed(2)} (${its.height.toFixed(2)} tall)`;
			}).join(', ');
			debug.log(`Stack of ${sections.length} as drawn, from its own top: lines at ${said('.gap-line')}; hairs at ${said('.hair')}; accents at ${said('.band')}.`);
		});
	});

	// Where the line above a section stands, measured from that section's own top edge — half the
	// space between them, every one of them. The first section's line is the leading one, and it
	// stands the same half-space above that section as every other line stands above its own.
	function line_at(at: number): number {
		return -spacing(at) / 2;
	}

	// The last section folded with the one above it open: that lone fold needs a separator to end
	// against, so the stack draws the heavy one exactly where the fold's accent ends. Two folds
	// running to the foot need none — the run of accent is boundary enough. Nor does any stack
	// whose caller says it draws every boundary down there itself.
	const add_end_separator = $derived(closes
		&&   sections.length > 1
		&&  !sections[sections.length - 2].folded
		&& !!sections[sections.length - 1].folded);

	// What the stack leaves below its last section: half the gap, the same empty space that stands
	// above every other separator — whether the separator down there is the stack's own or one
	// drawn by whatever holds it.
	const foot_gap = $derived(gap / 2);

	// Half the space above a section and half the space below it — the part of each gap that
	// belongs to this section rather than to its neighbour. A section that answers a press reads
	// these and reaches out over them, so the whole slot answers rather than the content alone.
	function over_of(at: number): number {
		return at === 0 ? (leads ? spacing(0) / 2 : 0) : spacing(at) / 2;
	}

	function isLast(at: number): boolean {
		return at === sections.length - 1;
	}

	function under_of(at: number): number {
		return isLast(at) ? Math.max(0, foot_gap) : spacing(at + 1) / 2;
	}

	// How far the separator below a fold is drawn from the fold's own separator, middle to middle.
	// One number for every fold on every screen, whether it folded one field or a run of tag rows.
	const FOLDED = k.height.small;

	// A folded section shows nothing and takes whatever height puts that next separator exactly the
	// folded distance below its own. Half the space above it and half the space below already
	// stand between the two, so the height is what is left of the folded distance once both come
	// out. The last section closes against the stack's own separator, drawn on its bottom edge, so
	// nothing at all is below it — and with no separator drawn down there it takes no height at all,
	// since there is nothing for the folded distance to reach.
	function height_of(at: number): number {
		const last = isLast(at);
		if (last && !add_end_separator) { return 0; }
		return FOLDED - spacing(at) / 2 - (last ? 0 : spacing(at + 1) / 2);
	}
</script>

<!-- A gap standing in for something folded, taking the accent with a hairline down its exact
     middle — so it reads as a line rather than as a stripe of color. It reaches out to the box's
     own edges, the way every line does. -->
{#snippet band(tall: number, middle: number, haired = true, hair_at = middle)}
	<div class='band' style:height='{tall}px' style:top='{middle - tall / 2}px'></div>
	{#if haired}<div class='hair' style:top='{hair_at}px'></div>{/if}
{/snippet}

<!-- A separator above the first section, where whatever holds this stack draws no boundary of its own.
     It stands clear of whatever line is drawn there, and the first section stands one space below
     it — the same distance every other section stands from the line above it.

     Nothing is set on the whole run: how far one section stands from the one above it is that
     pair's own, since a line carrying something at its middle takes more space than a plain one. -->
<div class='stack' bind:this={mine}
	style:padding-top={leads ? `${lead_at + spacing(0) / 2}px` : undefined}
	style:margin-bottom='{foot_gap}px'>
	{#if leads}
		<!-- The hair says a separator ends the band above it. With nothing drawn above this stack
		     there is none, so the band above its first separator wears no hair. -->
		{@render band(lead_at + over / 2, (lead_at - over / 2) / 2, over > 0)}
		<div class='gap-line' style:top='{lead_at}px'>
			<Separator {thickness} actions={leads} />
		</div>
	{/if}
	{#each sections as section, at (at)}
		<div class='stacked'
			class:folded={section.folded}
			style:--over='{over_of(at)}px'
			style:--under='{under_of(at)}px'
			style:margin-top={at > 0 ? `${spacing(at)}px` : undefined}
			style:height={section.folded ? `${height_of(at)}px` : undefined}>
			<!-- The accent fills the whole span between the two separators, so no page color is left
			     showing anywhere in it, and the hairline is drawn down the exact middle of that span
			     — which puts it exactly halfway between the two separators' own middles. -->
			{#if section.folded && (!isLast(at) || add_end_separator)}
				{@render band(FOLDED, line_at(at) + FOLDED / 2)}
			{/if}
			{#if at > 0}
				<div class='gap-line' style:top='{line_at(at)}px'>
					<Separator {thickness} actions={section.rides ?? null} />
				</div>
			{/if}
			{#if !section.folded}{@render section.subsection()}{/if}
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

	/* A section subsection a place of its own, since the line above it is measured from its top edge. */
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
		z-index        : var(--z-frontmost);
		transform      : translateY(-50%);
		background     : var(--black);
		position       : absolute;
		height         : 0.5px;
		pointer-events : none;
		right          : 0;
		left           : 0;
	}
</style>
