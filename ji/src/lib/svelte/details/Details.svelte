<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import type { Writable } from 'svelte/store';
	import { T_Details } from '../../ts/types/Details';
	import D_Preferences from './D_Preferences.svelte';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import Stack from '../support/Stack.svelte';
	import Separator from '../support/Separator.svelte';
	import Action, { T_Position } from '../../ts/types/Action';
	import D_Data from './D_Data.svelte';

	// The collapsible details region: the preferences and data sections. The frame
	// computes its width. Which sections are open is remembered as one saved list of
	// their names — both shut saves an empty list, while nothing saved at all means
	// both open, the first-time state.
	let { width, buildNumber, onBuildOpen }: { width: number; buildNumber: number; onBuildOpen: () => void } = $props();

	const w_details_open = preferences.persistent<string[]>(T_Preference.details_open, Object.values(T_Details));

	// One on/off view of that list per section, so a section's banner still just flips
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
	const w_data_open        = open_store(T_Details.data);

	$effect(() => {
		const open = $w_details_open;
		debug.log(`Details sections open: ${open.length === 0 ? 'none — both shut' : `[${open.join(', ')}]`}.`);
	});

	// The two words that fold each section away, built here rather than by the separators they
	// stand on. The browser makes a button one drawing after we ask, so each holds nothing on the
	// first drawing and the made button on the next — which is itself a change, so the stack is told.
	let preferences_word = $state<HTMLElement | null>(null);
	let data_word        = $state<HTMLElement | null>(null);
	const preferences_action = $derived(Object.assign(new Action(), { element: preferences_word, position: T_Position.left }));
	const data_action        = $derived(Object.assign(new Action(), { element: data_word,        position: T_Position.left }));
</script>

<!-- The two words, written out of sight: the moment the browser has made one, the stack takes it
     and puts it on a separator instead. -->
<div class='out_of_sight'>
	<button type='button' class='fold-word' bind:this={preferences_word}
		onclick={() => w_preferences_open.set(!$w_preferences_open)}>{T_Details.preferences}</button>
	<button type='button' class='fold-word' bind:this={data_word}
		onclick={() => w_data_open.set(!$w_data_open)}>{T_Details.data}</button>
</div>

{#snippet shows_preferences()}<D_Preferences />{/snippet}
{#snippet shows_data()}<D_Data />{/snippet}

<div class='region details' style:width='{width}px'>
	<!-- Everything from the first separator down to the last stands on the page color; the column's
	     own gap above it and whatever is left below it stand on the accent. -->
	<div class='holds-stack'>
		<!-- The column is one stack. Nothing above it draws a boundary, so it draws its own separator
		     over the first section, carrying that section's word. -->
		<Stack gap={k.gap.small} foot='below' leads={[preferences_action]} sections={[
			{ subsection: shows_preferences, folded: !$w_preferences_open },
			{ subsection: shows_data, rides: [data_action], folded: !$w_data_open },
		]} />
		<!-- What closes the last section off from the foot of the column, drawn here whether that
		     section is open or folded — so a fold down there always has a line to end against. -->
		<div class='foot'>
			<Separator thickness={k.thickness.huge} />
		</div>
	</div>
</div>

<!-- Pinned to the bottom-left of the whole frame (fixed to the window), so it holds
     its spot even though the details region owns it now — shown only while details is. -->
<div class='bottom-row layer-intersection'>
	<button class='build-button' onclick={onBuildOpen} use:tip={'show build notes'}>
		build {buildNumber}
	</button>
	<a class='author-credit' href='https://designintuition.app' target='_blank' rel='nobutton' use:tip={'my other work'}>
		author: jonathan sand
	</a>
</div>

<style>
	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	.details {
		background     : var(--accent);
		flex-direction : column;
		display        : flex;
		flex-shrink    : 0;
	}

	/* The page color runs from the first separator down to the last. It reaches out to the
	   column's edges and holds that width back as its own step-in, so the color runs the full
	   width while what it holds stands where it did. */
	.holds-stack {
		margin      : var(--gap-details) 0 0;
		padding     : 0 var(--gap);
		background  : var(--bg);
		flex-shrink : 0;
	}

	/* The line closing the last section off from the foot of the column. Everything in a stack is
	   measured middle to middle, and the stack leaves its bottom edge exactly where this line's
	   middle belongs — a line drawn below starts there instead, so it is pulled up half its own
	   thickness. */
	.foot {
		margin-top : calc(var(--thickness-huge) / -2);
		flex       : 0 0 auto;
	}

	/* Where the two fold words are written before the stack takes them. Each is taken out of here
	   on the very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* A word that folds its section away, standing on the separator above it. Its page-colored
	   background masks the separator behind it. */
	.fold-word {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-label);
		color         : var(--darkgray);
		padding       : 0 var(--gap);
		background    : var(--bg);
		font-family   : inherit;
		white-space   : nowrap;
		cursor        : pointer;
	}

	.fold-word:hover {
		background : var(--hover);
	}

	/* Pinned to the bottom-left of the whole frame, above everything. */
	.bottom-row {
		bottom         : var(--inset-credit-bottom);
		left           : var(--inset-credit-left);
		gap            : var(--gap);
		align-items    : center;
		position       : fixed;
		display        : flex;
		flex-direction : row;
	}

	.build-button {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		padding       : var(--pad-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-base);
		background    : var(--white);
		color         : var(--gray);
		box-sizing    : border-box;
		cursor        : pointer;
	}

	.build-button:hover {
		background : var(--hover);
	}

	.author-credit {
		font-size       : var(--font-credit);
		color           : var(--white);
		text-decoration : underline;
		cursor          : pointer;
	}

	.author-credit:hover {
		color : var(--hover);
	}
</style>
