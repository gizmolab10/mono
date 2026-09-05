<script lang='ts'>
	import type { Stacked, T_Foot } from '../../ts/types';
	import type { Action } from '../../ts/types';
	import type { Hit_Target_Options } from '../../ts/events/Hit_Target';
	import { hit_target, hits } from '../../ts/events';
	import { debug } from '../../ts/common';
	import { k } from '../../ts/common';
	import Separator from './Separator.svelte';

	// A run of sections, a gap between each pair, a line drawn centred in every gap.
	//
	// The gap belongs here rather than to a section, which is the whole of it: a line sitting in
	// the middle of a gap has equal space on both sides by construction, so nothing anywhere
	// subtracts half a thickness. A section can itself be a stack, and its own sections are then
	// subsection; every line on a page sits in some stack's gap.
	//
	// Lines go between sections and nowhere else — never above the first, never below the last.
	// Whatever subsection a stack draws its own boundary. A line at an end would have one side, so it
	// could not be centred in anything.
	//
	// Each section is given a slot that runs from the middle of the line above it to the middle of
	// the line below: the half-gaps are the slot's own padding. So a section that answers the cursor
	// answers across the whole slot without reaching anywhere — it says how in its entry, and the
	// slot itself carries the target and the fill.

	let {
		thickness  = k.thickness.huge,
		gap        = k.gap.normal,
		leads      = null,
		foot       = 'stack',
		over       = 0,
		under      = 0,
		sections,
	}: {
		thickness? : number;             // how thick the separator in each gap is drawn
		gap?       : number;             // how far apart two sections sit, said once for all of them
		over?      : number;             // how thick the separator is that whatever holds this stack draws above it; nothing, where it draws none
		under?     : number;             // how thick the separator is that whatever holds this stack draws below it, its top on the stack's bottom edge; nothing, where none is drawn there
		foot?      : T_Foot;             // who draws the separator at the stack's foot
		sections   : Stacked[];          // the sections, in the order they sit
		leads?     : Action[] | null;    // a separator above the first section, where whatever holds this stack draws no boundary of its own
	} = $props();

	// What a section's separator carries — everything the caller handed it, folded or open. A thing
	// at the middle hangs down into the fold below it, which is a run of accent; its own page-colored
	// pill masks that accent, so it reads as sitting on the line exactly as it does anywhere else.
	function actions_at(at: number): Action[] | null {
		return at === 0 ? leads : (sections[at].rides ?? null);
	}

	// How much space lies between this section and whatever is above it, middle to middle. The
	// separator's own body sits in the middle of that space, so its thickness is added on: the
	// gap a caller asks for is the empty space it sees on each side, never the distance between
	// two middles with a line drawn across it.
	//
	// Every separator takes the stack's own gap, whatever it carries.
	function spacing(_at: number): number {
		return gap + thickness;
	}

	// How far the separator below a fold is drawn from the fold's own separator, middle to middle.
	// One number for every fold on every screen, whether it folded one field or a run of tag rows.
	const FOLDED = k.height.small;

	// A section that takes a fold's height: folded, or open with nothing to show. Sizing an empty
	// one as a fold means folding it moves nothing below it. Only the fold is filled with the accent.
	function shut(one: Stacked): boolean {
		return !!one.folded || !!one.empty;
	}

	// Where the leading line sits, measured from the stack's own top. Everything here is
	// measured middle to middle, and the middle of the line above sits half its own thickness
	// higher than the stack — so that half comes off, and the two lines sit the same distance
	// apart as every other pair.
	const lead_at = $derived(FOLDED - over / 2);

	// Folding or opening moves everything below, and every rectangle the hits manager holds was
	// measured where its control stood then. They are all asked again once the browser has drawn.
	$effect(() => {
		sections.map((one) => [one.folded, one.empty]);
		hits.defer_recalibrate();
	});

	// What this stack settled on, every time a fold moves: how many sections, which of them are
	// folded, how far apart the pairs sit, and whether it closes itself at the foot.
	$effect(() => {
		const folds = sections.map((one, at) => `${at}${one.folded ? ' folded' : one.empty ? ' empty' : ' open'}`).join(', ');
		const bands = sections.map((one, at) => shut(one)
			? `${at} ${one.folded ? 'folded' : 'empty'} ${height_of(at).toFixed(2)} tall from its separator, the next ${FOLDED.toFixed(2)} below it`
			: `${at} open`).join('; ');
		debug.log(`Stack of ${sections.length}: ${folds}. Gap ${gap.toFixed(2)}, spacings [${sections.map((_, at) => spacing(at).toFixed(2)).join(', ')}], leading line ${leads ? `${lead_at.toFixed(2)} down under a ${over.toFixed(2)}-thick one` : 'none'}, closing separator ${add_end_separator ? 'drawn by the stack' : (foot === 'below' ? 'drawn below it' : 'not drawn')}. Folds: ${bands}.`);
	});

	// The last section folded with the one above it open: that lone fold needs a separator to end
	// against, so the stack draws the heavy one exactly where the fold's accent ends. Two folds
	// running to the foot need none — the run of accent is boundary enough. Nor does any stack
	// whose caller says the line down there is drawn by somebody else, or by nobody.
	const shown = $derived(sections.filter((one) => !one.hidden));
	const add_end_separator = $derived(foot === 'stack'
		&&   shown.length > 1
		&&  !shut(shown[shown.length - 2])
		&&   shut(shown[shown.length - 1]));

	// Whether a separator is drawn at the foot at all, by the stack or by whatever sits below it.
	// A fold is the span between two separators, so this is what says whether the last one has a
	// span to fill: with nothing down there it comes down to its own separator and nothing else.
	const line_at_foot = $derived(add_end_separator || foot === 'below');

	// What the stack leaves below its last section: half the gap, the same empty space that sits
	// above every other separator — whether the separator down there is the stack's own or one
	// drawn by whatever holds it.
	//
	// A fold ends exactly on the separator below it, so a folded last section leaves nothing at
	// all: the space would show as a strip of page color between that fold's accent and the line.
	const foot_gap = $derived(shown.length > 0 && shut(shown[shown.length - 1]) ? 0 : gap / 2);

	// The first section actually there. It has no line of its own above it unless the stack leads
	// with one, so it holds no half-gap above itself either.
	function is_first(at: number): boolean {
		return shown[0] === sections[at];
	}

	// Half the space above a section and half the space below it — the part of each gap that
	// belongs to this section rather than to its neighbour. Both are the slot's own padding, so the
	// slot runs from the middle of the line above to the middle of the line below.
	function over_of(at: number): number {
		return is_first(at) ? (leads ? spacing(at) / 2 : 0) : spacing(at) / 2;
	}

	// The neighbor below that is actually there — hidden sections keep their slot in the list
	// but not in the layout, so every measurement walks past them.
	function next_shown(at: number): number | null {
		for (let n = at + 1; n < sections.length; n++) { if (!sections[n].hidden) { return n; } }
		return null;
	}

	function isLast(at: number): boolean {
		return next_shown(at) === null;
	}

	function under_of(at: number): number {
		const next = next_shown(at);
		return next === null ? Math.max(0, foot_gap) : spacing(next) / 2;
	}

	// A shut section shows nothing and takes whatever height puts the next separator exactly the
	// folded distance below its own. Its slot runs from its own line to the next, half-gaps and all,
	// so that height is the folded distance itself. With no separator drawn at the foot, a shut last
	// section comes down to its own line and nothing else: its half-gap above, and no more.
	function height_of(at: number): number {
		const next = next_shown(at);
		if (next === null && !line_at_foot) { return over_of(at); }
		// A line drawn below the stack by whatever holds it grows downward from the stack's bottom
		// edge. Where it is thicker than the stack's own lines, the last shut section gives back the
		// extra, so that line's bottom edge sits where a usual line's would and the section reads
		// the same height whatever closes it.
		const extra = next === null && foot === 'below' ? Math.max(0, under - thickness) : 0;
		return FOLDED - extra;
	}

	// How a section's slot answers the cursor: what the section said, put to sleep while the
	// section is shut, since there is nothing there to answer for.
	function answers_of(section: Stacked): Hit_Target_Options | null {
		const answers = section.answers ?? null;
		return !answers ? null : { ...answers, dormant: !!answers.dormant || shut(section) };
	}

	// The slot's own target. A section that never answers gets none at all; one that starts
	// answering later gets its target then, and one that stops loses it.
	function answer(node: HTMLElement, options: Hit_Target_Options | null) {
		let made = !options ? null : hit_target(node, options);
		return {
			update(fresh: Hit_Target_Options | null) {
				if (!!made && !!fresh) { made.update(fresh); }
				else if (!made && !!fresh) { made = hit_target(node, fresh); }
				else if (!!made && !fresh) { made.destroy(); made = null; }
			},
			destroy() {
				made?.destroy();
				made = null;
			},
		};
	}
</script>

<!-- A gap in place of something folded, taking the accent with a hairline down its exact
     middle — so it reads as a line rather than as a stripe of color. It reaches out to the box's
     own edges, the way every line does. -->
{#snippet band(tall: number, middle: number, haired = true, hair_at = middle)}
	<div class='band' style:height='{tall}px' style:top='{middle - tall / 2}px'></div>
	{#if haired}<div class='hair' style:top='{hair_at}px'></div>{/if}
{/snippet}

<!-- A separator above the first section, where whatever holds this stack draws no boundary of its own.
     It sits clear of whatever line is drawn there, and the first section's slot begins on it —
     the same as every other section's slot begins on the line above it.

     Nothing is set on the whole run: each slot holds its own half-gaps, and the line above a
     section sits on that slot's top edge. -->
<div class='stack'
	style:padding-top={leads ? `${lead_at}px` : undefined}>
	{#if leads}
		<!-- The hair says a separator ends the fill above it. With nothing drawn above this stack
		     there is none, so the fill above its first separator wears no hair. -->
		{@render band(lead_at + over / 2, (lead_at - over / 2) / 2, over > 0)}
		<div class='gap-line' style:top='{lead_at}px'>
			<Separator {thickness} actions={actions_at(0)} />
		</div>
	{/if}
	{#each sections as section, at (at)}
		<!-- A hidden section is not there at all — no line, no height, no gap — but its slot
		     stays in the run, so the sections below it never shift onto other separators. -->
		<div class='stacked'
			class:folded={section.folded}
			class:highlighted={section.highlighted}
			style:display={section.hidden ? 'none' : undefined}
			style:padding-top='{over_of(at)}px'
			style:padding-bottom='{under_of(at)}px'
			style:height={shut(section) ? `${height_of(at)}px` : undefined}
			use:answer={answers_of(section)}>
			<!-- The accent fills the whole span between the two separators, so no page color is left
			     showing anywhere in it, and the hairline is drawn down the exact middle of that span
			     — which puts it exactly halfway between the two separators' own middles. -->
			{#if section.folded && !section.hidden && (!isLast(at) || line_at_foot)}
				{@render band(FOLDED, FOLDED / 2)}
			{/if}
			{#if !section.hidden && !is_first(at)}
				<div class='gap-line'>
					<Separator {thickness} actions={actions_at(at)} />
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
	/* Each slot holds its own half-gaps, so nothing is set on the run itself. */
	.stack {
		position       : relative;
		flex           : 0 0 auto;
		flex-direction : column;
		display        : flex;
	}

	/* A section's slot: from the middle of the line above to the middle of the line below, and
	   out to the box's own left and right edges, holding that width back as its own step-in so
	   what it shows sits exactly where it did. Its height, when stated, counts the padding in. */
	.stacked {
		margin-left   : calc(var(--gap) * -1);
		margin-right  : calc(var(--gap) * -1);
		padding-left  : var(--gap);
		padding-right : var(--gap);
		box-sizing    : border-box;
		position      : relative;
		flex          : 0 0 auto;
	}

	/* The whole slot fills while the cursor is on it, and while whatever holds the section says
	   it is highlighted — the way back to the list in the editor lights several slots as one. */
	.stacked:global([data-hit]),
	.stacked.highlighted {
		background : var(--hover);
	}

	.stacked:global([data-hit]) {
		cursor : pointer;
	}

	/* The line, hung off the slot's top edge and pulled back half of its own height — which puts
	   its middle exactly on that edge, whatever it is drawn at.
	   Pulling it back is a transform, and a transform makes a layer of its own, so whatever the line
	   sets inside it cannot rise above anything outside. The layer is said here instead, on the
	   thing that actually sits among the fills. */
	.gap-line {
		z-index   : var(--z-controls);
		transform : translateY(-50%);
		position  : absolute;
		right     : 0;
		left      : 0;
		top       : 0;
	}

	/* Inside a slot the box's edges are already reached, so a line, a fill and a hair sit in from
	   them by the slot's own step-in — the line's own reach then takes it to the edge, as before. */
	.stacked > .gap-line {
		right : var(--gap);
		left  : var(--gap);
	}

	.stacked > .band,
	.stacked > .hair {
		margin : 0;
	}

	/* The line the stack closes itself off with, its middle on the stack's own bottom edge. */
	.gap-line.foot {
		transform : translateY(50%);
		top       : auto;
		bottom    : 0;
	}

	/* The accent in place of what was folded, reaching out to the box's own edges. It is put
	   behind everything: the word riding the line above it hangs down into this space, and a fill
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
