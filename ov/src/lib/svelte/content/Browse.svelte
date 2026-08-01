<script lang='ts'>
	import { w_show_folders, w_sorts } from '../../ts/managers/Filters';
	import Guides_List from './Guides_List.svelte';
	import Separator from '../support/Separator.svelte';
	import Filters from '../support/Filters.svelte';
	import { guides } from '../../ts/managers/Guides';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	// Looking through the guides: the three filters across the top, how many they leave,
	// and the list itself. The narrowing happens in the hierarchy; this only shows it.
	const w_showing = guides.w_showing;

	let matching = $derived($w_showing.filter((r) => !r.guide.is_folder).length);
	let total    = $derived(guides.files.length);

	// The unsorted button only means something while the folders are hidden, at least one
	// column is sorting, and there is more than one file to put in an order. That is exactly
	// when it shows.
	let sorting = $derived(!$w_show_folders && $w_sorts.length > 0 && matching > 1);

	function toggle_folders() {
		const next = !$w_show_folders;
		w_show_folders.set(next);
		// Bringing the folders back stops the sorting outright — nothing is held in reserve,
		// so there is never a hidden choice waiting to surprise anyone.
		if (next && $w_sorts.length > 0) {
			debug.log(`Folders shown again, so the sorting stopped — ${$w_sorts.length} column(s) dropped, back to the walk's own order.`);
			w_sorts.set([]);
		}
		debug.log(`Folders are now ${next ? 'shown' : 'hidden'} in the list.`);
	}

	function stop_sorting() {
		debug.log(`Sorting stopped — ${$w_sorts.length} column(s) dropped, back to the walk's own order.`);
		w_sorts.set([]);
	}
</script>

<Filters />
<Separator thickness={k.separator.huge}/>
<div class='count-row'>
	<!-- With nothing left after the filters there are no folders to show or hide, so the
	     button has nothing to act on. -->
	{#if matching > 0}
		<button class='folders-button' onclick={toggle_folders} use:tip={$w_show_folders ? 'hide the folders' : 'show the folders'}>
			{$w_show_folders ? 'hide folders' : 'show folders'}
		</button>
	{/if}
	{#if sorting}
		<button class='folders-button' onclick={stop_sorting} use:tip={'back to the order the guides sit in'}>
			unsorted
		</button>
	{/if}
	<span class='count'>{matching} guides (of {total})</span>
</div>
<Guides_List />

<style>
	/* The button hugs the far left; the count is placed at the middle of the whole row
	   rather than centered in what the button leaves over, so it never drifts.
	   Pulled 2px closer to the dividers above and below, so the row takes less height. */
	.count-row {
		align-items : center;
		position    : relative;
		display     : flex;
		gap         : var(--gap-tight);
		margin      : -2px 0;
	}

	.count {
		transform   : translateX(-50%);
		opacity     : var(--opacity-header);
		font-size   : var(--font-label);
		white-space : nowrap;
		position    : absolute;
		left        : 50%;
	}

	.folders-button {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		height        : var(--height-control);
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		white-space   : nowrap;
		cursor        : pointer;
	}

	.folders-button:hover {
		background : var(--hover);
	}
</style>
