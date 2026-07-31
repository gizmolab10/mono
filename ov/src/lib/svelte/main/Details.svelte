<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import type { Writable } from 'svelte/store';
	import { T_Details } from '../../ts/types/Details';
	import D_Preferences from '../content/D_Preferences.svelte';
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

	$effect(() => {
		const open = $w_details_open;
		debug.log(`Details sections open: ${open.length === 0 ? 'none — all shut' : `[${open.join(', ')}]`}.`);
	});
</script>

<div class='region details' style:width='{width}px'>
	<Hideable title='preferences' bind:open={$w_preferences_open}>
		<D_Preferences />
	</Hideable>
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
		gap            : var(--gap-details);
		flex-shrink    : 0;
	}
</style>
