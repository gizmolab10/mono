<script lang='ts'>
	import { type Tag_Area, area_reads, tags_shown } from '../../ts/types/Tag_Areas';
	import { w_areas_open, toggle_area } from '../../ts/managers/Filters';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { tip } from '../../ts/utilities/Tooltip';
	import { k } from '../../ts/common/Constants';

	// One area of tags, standing as a single pill. Shut, it shows the tagset name — or the names
	// of whatever inside it is picked, so a filter is never hidden without a sign that it is on.
	// Open, it holds a cross at the left and its tags as one seg control at the right, both
	// inside a second border drawn within the first.
	//
	// Opening one area leaves the others as they are, and picking a tag leaves the area open,
	// since picking two tags of a kind is the ordinary thing to want.

	let { area, in_reach, chosen, ontoggle }:
		{ area: Tag_Area; in_reach: string[]; chosen: string[]; ontoggle: (tag: string) => void } = $props();

	// Which areas are open is remembered between visits, and kept in one place so an area left
	// open among the filters is open in the label form too.
	let open = $derived($w_areas_open.includes(area.name));

	const CROSS = k.size.normal * 0.7;
	const cross_path = svg_paths.x_cross(CROSS, CROSS / 6);

	// Only tags something is left wearing, plus whatever is already picked.
	let shown = $derived(tags_shown(area, in_reach, chosen));
	let reads = $derived(area_reads(area, chosen));

	// With one tag left there is nothing to fold away, so the area steps aside and the tag
	// stands on its own as an ordinary pill.
	let lone = $derived(shown.length === 1 ? shown[0] : '');

	// How long the pill takes to grow or shrink. The same number the styling reads, so the pill
	// and the rows it moves are one movement.
	const SLIDE = k.timeout.slide;

	// The pill grows in two turns: first the cross and the gap after it, then the run of tags.
	// Each takes the share of the time its own width is of the whole, so the pill widens at one
	// even rate throughout while its two parts arrive in order. Folding runs it backwards.
	//
	// How far along the run each tag's far edge sits is measured from the drawing itself: the tags
	// are not the same width, so nothing but measuring says when there is width enough for one.
	let run   = $state<HTMLElement | null>(null);
	let cross = $state<HTMLElement | null>(null);
	let edges = $state<number[]>([]);
	let first_share = $state(0);               // the cross and its gap, as a share of the whole

	$effect(() => {
		shown;                                     // measured again whenever the tags change
		const box = run;
		const mark = cross;
		if (!box || !mark) { edges = []; first_share = 0; return; }
		// The run's own full width is where its last tag ends. Asking the box how wide it is gives
		// whatever it has been squeezed to at that moment, which is not the same thing.
		const tags  = [...box.children] as HTMLElement[];
		const last  = tags[tags.length - 1];
		const whole = last ? last.offsetLeft + last.offsetWidth : 0;
		if (whole === 0) { edges = []; first_share = 0; return; }
		const measured = tags.map((one) => (one.offsetLeft + one.offsetWidth) / whole);
		const lead     = mark.offsetWidth + k.gap.tiny;
		const share    = lead / (lead + whole);
		edges = measured;
		first_share = share;
	});

	// How long each of the two turns lasts, and when the second one starts.
	let lead_time = $derived(Math.round(first_share * SLIDE));
	let run_time  = $derived(SLIDE - lead_time);

	// How long after the pill has stopped before it answers the cursor again. Without it, whatever
	// the cursor happens to be sitting over lights the instant everything lands, which reads as the
	// pill twitching rather than as pointing at something.
	const REST = k.timeout.rest;

	// Is the pill moving, or just finished moving? While it is, it wears the page color rather
	// than its own and nothing inside it answers.
	let moving = $state(false);
	let settled_at: ReturnType<typeof setTimeout> | null = null;
	let was_open: boolean | null = null;            // what it was last time, or nothing on the first look

	$effect(() => {
		if (was_open === null) { was_open = open; return; }   // just arrived on screen, so it is still
		if (open === was_open) { return; }          // nothing turned over, so nothing is moving
		was_open = open;
		moving = true;
		if (settled_at !== null) { clearTimeout(settled_at); }
		settled_at = setTimeout(() => { moving = false; settled_at = null; }, SLIDE + REST);
		return () => { if (settled_at !== null) { clearTimeout(settled_at); settled_at = null; } };
	});

	/**
	 * How long this tag waits before it appears. Growing, it waits for the cross to be there and
	 * then for the run to reach it. Shrinking, it goes as the run narrows past it — so the tag
	 * furthest along leaves first, and the one nearest the start leaves last.
	 */
	function waits_for(at: number): number {
		const share = edges[at] ?? 1;
		return Math.round(open ? lead_time + share * run_time : (1 - share) * run_time);
	}
</script>

<!-- One box, whatever state the area is in. Opening it does not swap one drawing for another —
     it grows the run of tags from nothing and shrinks the one word to nothing, so the pill's own
     width changes rather than jumping, and every pill after it slides along with it.
     A lone tag has nothing to fold away, so it never opens: its one word is the whole pill. -->
{#if shown.length !== 0}
	<div
		class='big'
		class:open={open && lone === ''}
		class:moving
		class:holding={lone !== '' ? chosen.includes(lone) : area.tags.some((tag) => chosen.includes(tag))}
		role='button'
		tabindex='-1'
		onkeyup={() => {}}
		use:tip={open && lone === '' ? false : lone !== '' ? `show files tagged "${lone}"` : `choose ➜ ${shown.join(', ')}`}
		onclick={() => { if (open && lone === '') { return; } if (lone !== '') { ontoggle(lone); return; } toggle_area(area.name); }}>
		<!-- The area's own name straddles the top edge whenever the words below it are not the
		     area's name — open, or shut with something picked, or standing in for a lone tag. -->
		{#if open || lone !== '' || area.tags.some((tag) => chosen.includes(tag))}
			<span class='area-name'>{area.name}</span>
		{/if}
		<!-- The cross that folds the area away. It is here whatever the state, and takes no width
		     while the area is shut. -->
		<div class='slot cross'
			style:--takes='{lead_time}ms'
			style:--starts='{open ? 0 : run_time}ms'
			style:--shows='{open ? lead_time : run_time}ms'>
			<button class='shut-me' bind:this={cross} aria-label={`shut ${area.name}`} use:tip={`hide ${area.name} tags`}
				onclick={(event) => { event.stopPropagation(); toggle_area(area.name); }}>
				<svg overflow='visible' viewBox='0 0 {CROSS} {CROSS}' width={CROSS} height={CROSS}>
					<path d={cross_path} />
				</svg>
			</button>
		</div>
		<!-- The tags themselves, taking no width while the area is shut. Each waits until the
		     growing pill is wide enough to hold it whole, then appears; folding, each goes as the
		     shrinking pill reaches it, so the last to arrive is the first to leave. -->
		<div class='slot run'
			style:--takes='{run_time}ms'
			style:--starts='{open ? lead_time : 0}ms'>
			<div class='inner'>
				<div class='segments' bind:this={run}>
					{#each shown as tag, at}
						<button class='segment' class:current={chosen.includes(tag)}
							style:--waits='{waits_for(at)}ms'
							use:tip={`show files tagged "${tag}"`}
							onclick={(event) => { event.stopPropagation(); ontoggle(tag); }}>{tag}</button>
					{/each}
				</div>
			</div>
		</div>
		<!-- The tagset name, or the names of what is picked, or a lone tag. It stands last, so
		     whatever of it is left mid-slide sits at the far end and never holds the seg control
		     off the cross. Its own width changes over the whole slide rather than in one turn,
		     which is what keeps the pill's edge moving at a single steady rate: the two turns
		     above add up to the same rate between them. -->
		<div class='slot named'>
			<span class='inner shut'>{lone !== '' ? lone : reads}</span>
		</div>
	</div>
{/if}

<style>
	/* The outer border. Inside it, held off by a tight gap, sits a second thinner one — the
	   double edge is what says this pill holds more than one word. */
	.big {
		border        : 0.7px solid var(--black);
		border-radius : var(--radius-pill);
		height        : var(--height);
		padding       : var(--gap-micro);
		background    : var(--white);
		box-sizing    : border-box;
		font-size     : var(--font-tiny);
		font-family   : inherit;
		color         : var(--text);
		align-items   : center;
		display       : inline-flex;
		position      : relative;
		cursor        : pointer;
		gap           : 0;
	}

	/* How long the pill takes to grow or shrink is said in one place for the whole app, so the
	   pill and the rows it pushes about move together. */
	.big {
		/* A size of "auto" is a word rather than a number, so a browser will not slide to it
		   unless it is told that words may be slid to. */
		interpolate-size : allow-keywords;
	}

	/* Each of the three things the pill can hold sits in a slot of its own. A slot the state does
	   not want takes no width at all, and the width itself is what slides — so the pill grows and
	   shrinks rather than swapping one drawing for another, and the pills beside it follow. */
	/* The width grows at an even rate rather than rushing at the start, because each tag's own
	   wait is counted evenly too. Eased, the space would open ahead of the tags filling it.
	   Each slot takes only its own share of the time, and waits its turn — so the cross and the
	   gap after it arrive first, then the run of tags, and folding runs it backwards. The two
	   shares add up to the whole, so the pill still widens at one steady rate throughout. */
	.slot {
		transition : width var(--takes, var(--slide)) linear var(--starts, 0ms),
		             margin-right var(--takes, var(--slide)) linear var(--starts, 0ms);
		align-items: center;
		overflow   : hidden;
		display    : flex;
		height     : 100%;
		width      : 0;
	}

	/* What a slot holds keeps its own full width all the way through, and is simply uncovered as
	   the slot widens. Left to itself it would be squeezed into whatever width the slot has that
	   frame, so the words inside would shuffle and re-wrap on every one of them.
	   It is also out of sight for the whole of the slide: a half-drawn pill sliced down the
	   middle reads as broken, so the pill stretches empty and its contents arrive at the end.
	   Out of sight, it answers nothing — which is what keeps a tag from lighting mid-slide. */
	.slot > * {
		transition     : opacity 0s;
		pointer-events : none;
		flex-shrink    : 0;
		opacity        : 0;
	}

	/* The slot this state wants: its contents appear the moment the widening is over. The run of
	   tags is the exception — it is uncovered a tag at a time, each on its own wait. */
	.big .named > *,
	.big.open .cross > * {
		transition     : opacity 0s var(--slide);
		pointer-events : auto;
		opacity        : 1;
	}

	/* The cross stands at the left end. Growing, it is whole before the run begins; folding, it
	   stays whole until the run has gone. */
	.big.open .cross > *,
	.big .cross > * {
		transition-delay : var(--shows, 0ms);
	}

	/* The run itself is always drawn; what waits is each tag inside it. */
	.big .run > * {
		pointer-events : auto;
		opacity        : 1;
		transition     : none;
	}

	/* Each tag appears when the growing pill is wide enough to hold it whole, and goes as the
	   shrinking pill narrows past it — so the last to arrive is the first to leave. */
	.segment {
		transition     : opacity 0s var(--waits, 0ms);
		pointer-events : none;
		opacity        : 0;
	}

	.big.open .segment {
		pointer-events : auto;
		opacity        : 1;
	}

	/* Open, the one word goes — at once, so nothing is seen being cut in half. */
	.big.open .named > * {
		transition     : opacity 0s;
		pointer-events : none;
		opacity        : 0;
	}

	/* Shut: the one word is the whole pill. */
	.big .named {
		width : auto;
	}

	/* Open: the cross and the run of tags take their own width, one gap apart, and the word is
	   gone. */
	.big.open .named {
		width : 0;
	}

	.big.open .cross,
	.big.open .run {
		margin-right : var(--gap-tiny);
		width        : auto;
	}

	.big.open .run {
		margin-right : 0;
	}

	/* Its own fill, so whatever color the outer pill wears shows only in the thin ring
	   between the two borders rather than behind the words as well. */
	.inner {
		border        : 0.5px solid var(--black);
		border-radius : var(--radius-pill);
		background    : var(--white);
		box-sizing    : border-box;
		align-items   : center;
		display       : flex;
		gap           : var(--gap);
		overflow      : hidden;
		height        : 100%;
	}

	/* Shut, the one word sits inside the second border, held clear of it left and right. */
	.inner.shut {
		align-items : center;
		padding     : 0 var(--gap);
		white-space : nowrap;
		display     : flex;
	}

	/* Shut with something inside it picked, the words read as chosen — the same accent fill
	   every other picked thing wears. */
	.big.holding .inner.shut {
		background : var(--accent);
		color      : var(--text-on-accent);
	}

	/* The whole shut pill answers to the cursor, so its inside lights up. */
	.big:hover .inner.shut {
		background : var(--hover);
		color      : var(--text);
	}

	/* Shut with something inside it picked: the ring between the two borders is filled, so a
	   filter that is on can be seen at a glance without opening the area. Under the cursor the
	   two swap — the ring clears while the words light — so the pill still answers to a hover
	   rather than sitting flat. */
	.big.holding {
		background : var(--hover);
	}

	.big.holding:hover {
		background : var(--white);
	}

	/* Open, the pill itself no longer answers a press — the cross and the tags do. */
	.big.open {
		cursor : default;
	}

	/* Open, and all the while it is moving, the pill wears the page color: what shows between its
	   two borders then reads as a ring rather than as a second white pill inside a white one. */
	.big.open,
	.big.moving {
		background : var(--bg);
	}

	/* Nothing inside answers while the pill is moving, nor for a moment after it lands — so
	   whatever the cursor is sitting over does not light the instant everything stops. */
	.big.moving .segment,
	.big.moving .shut-me,
	.big.moving .inner.shut {
		pointer-events : none;
	}

	/* The name sitting on the top edge, its page-colored background breaking the border so the
	   word reads as a heading on the pill rather than as one of its tags. It starts where the
	   pill starts, whatever state the pill is in, so a row of them reads down a straight line. */
	.area-name {
		background     : var(--section-bg, var(--bg));
		transform      : translateY(-50%);
		border-radius  : var(--radius-pill);
		font-size      : var(--font-faint);
		padding        : 0 var(--gap-tiny);
		color          : var(--gray);
		position       : absolute;
		white-space    : nowrap;
		pointer-events : none;
		top            : calc(-2px - var(--gap-faint));
		left           : 0;
	}

	/* The cross that folds the area away: its own round edge at the left end. */
	.shut-me {
		border          : 0.5px solid var(--black);
		border-radius   : var(--radius-percent);
		background      : var(--white);
		box-sizing      : border-box;
		justify-content : center;
		align-items     : center;
		aspect-ratio    : 1;
		display         : flex;
		cursor          : pointer;
		height          : 100%;
		padding         : 0;
	}

	.shut-me svg {
		fill         : none;
		stroke       : var(--text);
		stroke-width : 1.2;
	}

	.shut-me:hover {
		background : var(--hover);
	}

	/* The tags themselves, one run with a line between each — the whole run never breaks
	   across lines, so an open area reads as one thing. */
	/* Nothing in the run gives up any width, whatever the slot around it is doing. Squeezed, the
	   tags would report themselves narrower than they are, and the waits worked out from those
	   numbers would all be wrong. */
	.segments,
	.segment {
		flex-shrink : 0;
	}

	.segments {
		align-items : stretch;
		white-space : nowrap;
		display     : flex;
		height      : 100%;
	}

	.segment {
		padding     : 0 var(--gap);
		background  : transparent;
		font-size   : var(--font-tiny);
		font-family : inherit;
		color       : var(--text);
		white-space : nowrap;
		cursor      : pointer;
		border      : none;
	}

	.segment:not(:last-child) {
		border-right : 0.5px solid var(--black);
	}

	.segment.current {
		background : var(--accent);
		color      : var(--text-on-accent);
	}

	/* Every tag answers to the cursor the same way, picked or not — so pointing at one already
	   on still shows that a click would do something. */
	.segment:hover {
		background : var(--hover);
		color      : var(--text);
	}

</style>
