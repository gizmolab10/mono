<script lang='ts'>
	import { report_line_spacing } from '../../ts/common/Core';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { Action, T_Position } from '../../ts/common/Core';
	import { hit_target } from '../../ts/common/Core';
	import { Separator } from '../../ts/common/Core';
	import { hits } from '../../ts/common/Core';
	import { k } from '../../ts/common/Core';
	import type { Writable } from 'svelte/store';
	import { T_Details } from '../../ts/common/Core';
	import D_Preferences from '../content/D_Preferences.svelte';
	import D_Repair from '../content/D_Repair.svelte';
	import D_Rules from '../content/D_Rules.svelte';
	import { debug } from '../../ts/common/Core';
	import { Stack } from '../../ts/common/Core';
	import type { Snippet } from 'svelte';

	// The details column's contents, inside panel's region, which is given its width: three things
	// that fold, preferences, repair and the rules, and below them the host's own section, where
	// the host hands one. Which sections are open is remembered as one saved list of their names —
	// all shut saves an empty list, while nothing saved at all means all open, the first-time state.
	let { width, section }: { width: number; section?: Snippet } = $props();

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
	const w_rules_open       = open_store(T_Details.rules);

	// The words that fold each section away, built here rather than by the separators they stand
	// on. The browser makes a button one drawing after we ask, so each holds nothing on the first
	// drawing and the made button on the next — which is itself a change, so the stack is told.
	let preferences_word = $state<HTMLElement | null>(null);
	let repair_word      = $state<HTMLElement | null>(null);
	let rules_word       = $state<HTMLElement | null>(null);
	const preferences_action = $derived(Object.assign(new Action(), { element: preferences_word, position: T_Position.left }));
	const repair_action      = $derived(Object.assign(new Action(), { element: repair_word,      position: T_Position.left }));
	const rules_action       = $derived(Object.assign(new Action(), { element: rules_word,       position: T_Position.left }));

	// The column's own lines, and nothing from the column beside it. Read once the browser has
	// drawn, since a fold moves every line below it.
	let column = $state<HTMLElement | null>(null);

	$effect(() => {
		const open = $w_details_open;
		debug.log(`Details sections open: ${open.length === 0 ? 'none — all shut' : `[${open.join(', ')}]`}.`);
		const soon = setTimeout(() => report_line_spacing('the details', column), k.timeout.slide);
		return () => clearTimeout(soon);
	});

	// The column is given its width from outside, and it changes without the window changing —
	// showing the column, hiding it, or the window growing past where both fit. Everything in it
	// stands somewhere new, so the hits manager is told once the browser has drawn.
	$effect(() => {
		width;
		hits.defer_recalibrate();
	});
</script>

<!-- The three words, written out of sight: the moment the browser has made one, the stack takes
     it and puts it on a separator instead. -->
<div class='out_of_sight'>
	<button type='button' class='clickable' bind:this={preferences_word}
		use:hit_target={{ id: `details.fold.${T_Details.preferences}`,
			onpress: () => w_preferences_open.set(!$w_preferences_open) }}>{T_Details.preferences}</button>
	<button type='button' class='clickable' bind:this={repair_word}
		use:hit_target={{ id: `details.fold.${T_Details.repair}`,
			onpress: () => w_repair_open.set(!$w_repair_open) }}>{T_Details.repair}</button>
	<button type='button' class='clickable' bind:this={rules_word}
		use:hit_target={{ id: `details.fold.${T_Details.rules}`,
			onpress: () => w_rules_open.set(!$w_rules_open) }}>{T_Details.rules}</button>
</div>

{#snippet shows_preferences()}<D_Preferences />{/snippet}
{#snippet shows_repair()}<D_Repair />{/snippet}
{#snippet shows_rules()}<D_Rules />{/snippet}
{#snippet shows_host()}{@render section?.()}{/snippet}

<!-- Everything from the first separator down to the last stands on the page color, panel's region's
     own. It reaches out to the region's edges and holds that width back as its own step-in, so the
     page color runs the full width while what it holds stands where it did. -->
<div class='holds-stack' bind:this={column}>
		<!-- The column is one stack. Nothing above it draws a boundary, so it draws its own separator
			over the first section, carrying that section's word. -->
		<!-- Twice the small gap, since a stack's gap is the whole space between two sections and the
			separator takes its middle — so each side of every separator holds the small gap. -->
		<Stack gap={k.gap.big} foot='below' leads={[preferences_action]} sections={[
			{ subsection: shows_preferences, folded: !$w_preferences_open },
			{ subsection: shows_repair, rides: [repair_action], folded: !$w_repair_open },
			{ subsection: shows_rules, rides: [rules_action], folded: !$w_rules_open },
			// The host's own section, below the rules, only where the host hands one.
			...(section ? [{ subsection: shows_host }] : []),
		]} />
		<!-- What closes the last section off from the foot of the column, drawn here whether that
			section is open or folded — so a fold down there always has a line to end against. -->
		<div class='foot'>
			<Separator thickness={k.thickness.huge} />
		</div>
</div>

<style>
	/* Where the two clickables are written before the stack takes them. Each is taken out of here
	   on the very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* A word that folds its section away, standing on the separator above it. Its white
	   background masks the separator behind it. */
	.clickable {
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		color         : var(--darkgray);
		padding       : 0 var(--gap);
		background    : var(--white);
		box-sizing    : border-box;
		font-family   : inherit;
		white-space   : nowrap;
		cursor        : pointer;
	}

	.clickable:global([data-hit]) {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

	/* The closing separator, pulled up half its own thickness. Every distance in a stack is measured
	   middle to middle, and the stack leaves its bottom edge exactly where this line's middle
	   belongs — but a line drawn below it starts there instead, which is half a thickness too low. */
	.foot {
		margin-top : calc(var(--thick-huge) / -2);
		flex       : 0 0 auto;
	}

	/* The separators and what they hold. It reaches out to the region's edges and holds that width
	   back as its own step-in, so the page color runs the full width while what it holds stands
	   where it did. It takes only the height it needs. */
	.holds-stack {
		margin         : 0 calc(var(--gap) * -1);
		padding        : 0 var(--gap);
		background     : var(--bg);
		flex-direction : column;
		display        : flex;
		flex           : 0 0 auto;
		gap            : 0;
	}
</style>
