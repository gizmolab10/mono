<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import Action, { T_Position } from '../../ts/types/Action';
	import { hit_target } from '../../ts/events/Hit_Target';
	import Separator from '../support/Separator.svelte';
	import { hits } from '../../ts/events/Hits';
	import { k } from '../../ts/common/Constants';
	import type { Writable } from 'svelte/store';
	import { T_Details } from '../../ts/types/Details';
	import D_Preferences from '../content/D_Preferences.svelte';
	import D_Repair from '../content/D_Repair.svelte';
	import { debug } from '../../ts/common/Debug';
	import Stack from '../support/Stack.svelte';

	// The collapsible details column. The frame computes its width. Which sections are
	// open is remembered as one saved list of their names — all shut saves an empty
	// list, while nothing saved at all means all open, the first-time state.
	let { width }: { width: number } = $props();

	const w_details_open = preferences.persistent<string[]>(T_Preference.details_open, Object.values(T_Details));

	// One on/off view of that list per section, so a section's own word still just flips
	// itself: reading says whether this section is in the list, setting adds or removes it.
	function open_store(section: T_Details): Writable<boolean> {
		const put = (open: boolean) => w_details_open.update((list) => {
			const others = list.filter((name) => name !== section);
			return open ? [...others, section] : others;
		});
		return {
			subscribe : (run) => w_details_open.subscribe((list) => run(list.includes(section))),
			set       : put,
			update    : (fn) => w_details_open.update((list) => {
				const others = list.filter((name) => name !== section);
				return fn(list.includes(section)) ? [...others, section] : others;
			}),
		};
	}

	const w_preferences_open = open_store(T_Details.preferences);
	const w_repair_open      = open_store(T_Details.repair);

	// The words that fold each section away, built here rather than by the separators they stand
	// on. The browser makes a button one drawing after we ask, so each holds nothing on the first
	// drawing and the made button on the next — which is itself a change, so the stack is told.
	let preferences_word = $state<HTMLElement | null>(null);
	let repair_word      = $state<HTMLElement | null>(null);
	const preferences_action = $derived(Object.assign(new Action(), { element: preferences_word, position: T_Position.left }));
	const repair_action      = $derived(Object.assign(new Action(), { element: repair_word,      position: T_Position.left }));

	$effect(() => {
		const open = $w_details_open;
		debug.log(`Details sections open: ${open.length === 0 ? 'none — all shut' : `[${open.join(', ')}]`}.`);
	});

	// The column is given its width from outside, and it changes without the window changing —
	// showing the column, hiding it, or the window growing past where both fit. Everything in it
	// stands somewhere new, so the hits manager is told once the browser has drawn.
	$effect(() => {
		width;
		hits.defer_recalibrate();
	});
</script>

<!-- The two words, written out of sight: the moment the browser has made one, the stack takes it
     and puts it on a separator instead. -->
<div class='out_of_sight'>
	<button type='button' class='fold-word' bind:this={preferences_word}
		use:hit_target={{ id: `details.fold.${T_Details.preferences}`,
			onpress: () => w_preferences_open.set(!$w_preferences_open) }}>{T_Details.preferences}</button>
	<button type='button' class='fold-word' bind:this={repair_word}
		use:hit_target={{ id: `details.fold.${T_Details.repair}`,
			onpress: () => w_repair_open.set(!$w_repair_open) }}>{T_Details.repair}</button>
</div>

{#snippet shows_preferences()}<D_Preferences />{/snippet}
{#snippet shows_repair()}<D_Repair />{/snippet}

<div class='region details' style:width='{width}px'>
	<!-- Everything from the first separator down to the last stands on the page color; the column's
	     own gap above it and whatever is left below it stand on the accent. It reaches out to the
	     column's edges and holds that width back as its own step-in, so the page color runs the
	     full width while what it holds stands where it did. -->
	<div class='holds-stack'>
		<!-- The column is one stack. Nothing above it draws a boundary, so it draws its own separator
			over the first section, carrying that section's word. -->
		<!-- Twice the small gap, since a stack's gap is the whole space between two sections and the
			separator takes its middle — so each side of every separator holds the small gap. -->
		<Stack gap={k.gap.big} foot='below' leads={[preferences_action]} sections={[
			{ subsection: shows_preferences, folded: !$w_preferences_open },
			{ subsection: shows_repair, rides: [repair_action], folded: !$w_repair_open },
		]} />
		<!-- What closes the last section off from the foot of the column, drawn here whether that
			section is open or folded — so a fold down there always has a line to end against. -->
		<div class='foot'>
			<Separator thickness={k.thickness.huge} />
		</div>
	</div>
</div>

<style>
	/* Where the two fold words are written before the stack takes them. Each is taken out of here
	   on the very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* A word that folds its section away, standing on the separator above it. Its page-colored
	   background masks the separator behind it. */
	.fold-word {
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

	.fold-word:global([data-hit]) {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	/* The closing separator's own gap is its own; nothing is added here. */
	.foot {
		flex : 0 0 auto;
	}

	/* The separators and what they hold. It reaches out to the column's edges and holds that width
	   back as its own step-in, so the page color runs the full width while what it holds stands
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

	/* The whole column stands on the accent: the gap above its first separator, and whatever is
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
