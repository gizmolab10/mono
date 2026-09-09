<script lang='ts'>
	import { Action, Separator, Stack, T_Position, hit_target, hits, k } from '../ts/common/Core';
	import { preferences, T_Preference } from '../ts/managers/Preferences';
	import D_Preferences from './D_Preferences.svelte';

	// The details column. App.svelte computes its width. One section in it, the preferences —
	// the two color pickers taken from ov — under a word on the line above it that folds it away
	// and brings it back. Whether it is open is remembered between visits, open on the first.
	let { width }: { width: number } = $props();

	const w_preferences_open = preferences.persistent<boolean>(T_Preference.preferences_open, true);

	// The word that folds the section away, built here rather than by the separator it sits on.
	// The browser makes a button one drawing after we ask, so this holds nothing on the first
	// drawing and the made button on the next — which is itself a change, so the stack is told.
	let preferences_word = $state<HTMLElement | null>(null);
	const preferences_action = $derived(Object.assign(new Action(), { element: preferences_word, position: T_Position.left }));

	// The column is given its width from outside, and it changes without the window changing —
	// showing the column, hiding it, or the window growing past where both fit. Everything in it
	// sits somewhere new, so the hits manager is told once the browser has drawn.
	$effect(() => {
		width;
		hits.defer_recalibrate();
	});
</script>

<!-- The word, written out of sight: the moment the browser has made it, the stack takes it and
     puts it on the separator instead. -->
<div class='out_of_sight'>
	<button type='button' class='clickable' bind:this={preferences_word}
		use:hit_target={{ id: 'details.fold.preferences',
			onpress: () => w_preferences_open.set(!$w_preferences_open) }}>preferences</button>
</div>

{#snippet shows_preferences()}<D_Preferences />{/snippet}

<div class='region details' style:width='{width}px'>
	<!-- Everything from the first separator down to the last sits on the page color; the column's
	     own gap above it and whatever is left below it sit on the accent. -->
	<div class='holds-stack'>
		<!-- The column is one stack. Nothing above it draws a boundary, so it draws its own separator
		     over the first section, carrying that section's word. -->
		<Stack gap={k.gap.big} foot='below' leads={[preferences_action]} sections={[
			{ subsection: shows_preferences, folded: !$w_preferences_open },
		]} />
		<!-- What closes the section off from the foot of the column, drawn here whether the section
		     is open or folded — so a fold always has a line to end against. -->
		<div class='foot'>
			<Separator thickness={k.thickness.huge} />
		</div>
	</div>
</div>

<style>
	/* Where the clickable is written before the stack takes it. It is taken out of here on the
	   very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* A word that folds its section away, sitting on the separator above it. Its page-colored
	   background masks the separator behind it. */
	.clickable {
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		color         : var(--darkgray);
		padding       : 0 var(--gap);
		background    : var(--bg);
		box-sizing    : border-box;
		font-family   : inherit;
		white-space   : nowrap;
		cursor        : pointer;
	}

	.clickable:global([data-hit]) {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	/* The closing separator, pulled up half its own thickness. Every distance in a stack is measured
	   middle to middle, and the stack leaves its bottom edge exactly where this line's middle
	   belongs — but a line drawn below it starts there instead, which is half a thickness too low. */
	.foot {
		margin-top : calc(var(--thick-huge) / -2);
		flex       : 0 0 auto;
	}

	/* The separators and what they hold. It reaches out to the column's edges and holds that width
	   back as its own step-in, so the page color runs the full width while what it holds sits
	   where it did. It takes only the height it needs, so what is left below the last separator is
	   the column's own accent. */
	.holds-stack {
		margin         : 0 calc(var(--gap) * -1);
		padding        : 0 var(--gap);
		background     : var(--bg);
		flex-direction : column;
		display        : flex;
		flex           : 0 0 auto;
		gap            : 0;
	}

	/* The whole column sits on the accent: the gap above its first separator, and whatever is
	   left below its last one. The gap above is the stack's own, so nothing is held here. */
	.details {
		background     : var(--accent);
		padding        : 0 var(--gap) var(--gap);
		box-sizing     : border-box;
		flex-direction : column;
		display        : flex;
		gap            : 0;
		flex-shrink    : 0;
	}
</style>
