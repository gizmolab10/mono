<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import Separator from '../support/Separator.svelte';
	import { hits } from '../../ts/events/Hits';
	import { k } from '../../ts/common/Constants';
	import type { Writable } from 'svelte/store';
	import { T_Details } from '../../ts/types/Details';
	import D_Preferences from '../content/D_Preferences.svelte';
	import D_Repair from '../content/D_Repair.svelte';
	import { debug } from '../../ts/common/Debug';
	import Hideable from '../support/Hideable.svelte';

	// The collapsible details column. The frame computes its width. Which sections are
	// open is remembered as one saved list of their names — all shut saves an empty
	// list, while nothing saved at all means all open, the first-time state.
	let { width }: { width: number } = $props();

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
	const w_repair_open       = open_store(T_Details.repair);

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

<div class='region details' style:width='{width}px'>
	<!-- Everything from the first line down to the last stands on the page color; the column's own
	     gap above it and whatever is left below it stand on the accent. It reaches out to the
	     column's edges and holds that width back as its own step-in, so the page color runs the
	     full width while what it holds stands where it did. -->
	<div class='stack'>
	<Hideable title='preferences' bind:open={$w_preferences_open}>
		<D_Preferences />
	</Hideable>
	<!-- The last thing in the column. Folded, it stands one gap tall with its own hairline down the
	     middle, whether or not the one above it is folded too. -->
	<Hideable title='repair' bind:open={$w_repair_open}>
		<D_Repair />
	</Hideable>
	<!-- What closes the last section off from the foot of the column. Folded, there is nothing
	     below its own line to close off, so nothing is drawn here at all. -->
	{#if $w_repair_open}
		<div class='foot'>
			<Separator thickness={k.thickness.huge} />
		</div>
	{/if}
	</div>
</div>

<style>
	.region {
		border-radius : var(--radius);
		position      : relative;
		overflow      : hidden;
	}

	/* The closing line's own gap is the separator's; nothing is added here, the same as a
	   section's line. */
	.foot {
		flex : 0 0 auto;
	}

	/* The lines and what they hold. It reaches out to the column's edges and holds that width back
	   as its own step-in, so the page color runs the full width while what it holds stands where
	   it did. It takes only the height it needs, so what is left below the last line is the
	   column's own accent. No gap between the sections: each holds its own, and two sources of gap
	   is the fault that whole piece exists to remove. */
	.stack {
		margin         : 0 calc(var(--gap) * -1);
		padding        : 0 var(--gap);
		background     : var(--bg);
		flex-direction : column;
		display        : flex;
		flex           : 0 0 auto;
		gap            : 0;
	}

	/* The whole column stands on the accent: the gap above its first line, and whatever is left
	   below its last one. Its own gap around the edge is the width a section's body reaches out
	   into, so a fill runs to the column's own edges rather than stopping short. */
	.details {
		background     : var(--accent);
		padding        : var(--gap);
		box-sizing     : border-box;
		flex-direction : column;
		display        : flex;
		gap            : 0;
		flex-shrink    : 0;
	}
</style>
