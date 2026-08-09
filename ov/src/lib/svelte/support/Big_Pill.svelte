<script lang='ts'>
	import { type Tag_Area, area_reads, tags_shown } from '../../ts/types/Tag_Areas';
	import { w_areas_open, toggle_area } from '../../ts/managers/Filters';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { tip } from '../../ts/utilities/Tooltip';
	import { k } from '../../ts/common/Constants';

	// One area of tags, standing as a single pill. Shut, it is one word — the area's own name,
	// or the names of whatever inside it is picked, so a filter is never hidden without a sign
	// that it is on. Open, it holds a cross at the left and its tags as one run of segments at
	// the right, both inside a second border drawn within the first.
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
	let word = $derived(area_reads(area, chosen));

	// With one tag left there is nothing to fold away, so the area steps aside and the tag
	// stands on its own as an ordinary pill.
	let lone = $derived(shown.length === 1 ? shown[0] : '');
</script>

{#if shown.length !== 0}
	{#if lone !== ''}
		<!-- One tag left, so there is nothing to fold away — but it is drawn as the same double
		     pill the others are, with its area's name on the top edge, so a lone tag still says
		     which area it came from. -->
		<button class='big shut-pill' class:holding={chosen.includes(lone)}
			use:tip={`show files tagged "${lone}"`}
			onclick={() => ontoggle(lone)}>
			<span class='area-name'>{area.name}</span>
			<span class='inner shut'>{lone}</span>
		</button>
	{:else if !open}
		{@const holding = area.tags.some((tag) => chosen.includes(tag))}
		<button class='big shut-pill' class:holding use:tip={`choose ➜ ${shown.join(', ')}`} onclick={() => toggle_area(area.name)}>
			<!-- Shut with something picked, the pill reads the picked names — so the area's own
			     name moves to the top edge, the way it sits while the area is open. -->
			{#if holding}
				<span class='area-name'>{area.name}</span>
			{/if}
			<span class='inner shut'>{word}</span>
		</button>
	{:else}
		<!-- Two things side by side inside the outer border, each with an edge of its own:
		     the cross that folds the area away, and the run of tags. -->
		<div class='big open'>
			<!-- Open, the area's own name straddles the top edge, so the run of tags still says
			     which area it belongs to. -->
			<span class='area-name'>{area.name}</span>
			<button class='shut-me' aria-label={`shut ${area.name}`} use:tip={`hide ${area.name} tags`}
				onclick={() => toggle_area(area.name)}>
				<svg overflow='visible' viewBox='0 0 {CROSS} {CROSS}' width={CROSS} height={CROSS}>
					<path d={cross_path} />
				</svg>
			</button>
			<div class='inner'>
				<div class='segments'>
					{#each shown as tag}
						<button class='segment' class:current={chosen.includes(tag)}
							use:tip={`show files tagged "${tag}"`}
							onclick={() => ontoggle(tag)}>{tag}</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
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
		display       : inline-flex;
		cursor        : pointer;
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

	/* Open, the outer border holds two bordered things with a gap between them. */
	.big.open {
		align-items : center;
		cursor      : default;
		gap         : var(--gap-tiny);
	}

	/* Both states anchor the name that sits on their top edge. */
	.big.open,
	.big.shut-pill {
		position : relative;
	}

	/* The name sitting on the top edge, its page-colored background breaking the border so the
	   word reads as a heading on the pill rather than as one of its tags. It starts where the
	   pill starts, whatever state the pill is in, so a row of them reads down a straight line. */
	.area-name {
		background     : color-mix(in srgb, var(--bg) 44%, transparent);
		transform      : translateY(-50%);
		border-radius  : var(--radius-pill);
		font-size      : var(--font-faint);
		padding        : 0 var(--gap-tiny);
		color          : var(--gray);
		position       : absolute;
		white-space    : nowrap;
		pointer-events : none;
		top            : -1px;
		left           : 0;
	}

	/* The cross that folds the area away: its own round edge at the left end. */
	.shut-me {
		border          : 0.5px solid var(--black);
		border-radius   : var(--radius-percent);
		background      : transparent;
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
