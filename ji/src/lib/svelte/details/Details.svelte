<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import type { Writable } from 'svelte/store';
	import { T_Details } from '../../ts/types/Details';
	import D_Preferences from './D_Preferences.svelte';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import Hideable from './Hideable.svelte';
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
</script>

<div class='region details' style:width='{width}px'>
	<Hideable title='preferences' bind:open={$w_preferences_open}>
		<D_Preferences />
	</Hideable>
	<Hideable title='data' bind:open={$w_data_open}>
		<D_Data />
	</Hideable>
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
		gap            : var(--gap-details);
		flex-shrink    : 0;
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
