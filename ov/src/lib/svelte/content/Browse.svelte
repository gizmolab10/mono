<script lang='ts'>
	import { w_purposes, w_show_folders, w_sorts, w_kind, w_project, w_tags } from '../../ts/managers/Filters';
	import Files, { w_scrollbar_showing } from './Files.svelte';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { guides } from '../../ts/managers/Guides';
	import { T_Purpose } from '../../ts/types/Guide';
	import { tip } from '../../ts/utilities/Tooltip';
	import Filters from '../support/Filters.svelte';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	// How wide the drawn bar runs — the same size the folder triangles use.
	const MARK = k.size.control;

	// Looking through the guides: the three filters across the top, how many they leave,
	// and the list itself. The narrowing happens in the hierarchy; this only shows it.
	const w_showing = guides.w_showing;

	// How many guides the filters leave — counted before the folds, so shutting a folder
	// hides its files from the list without changing what the count says.
	let matching = $derived.by(() => { $w_showing; return guides.hierarchy.matched_count; });
	// How many there are to be had at all — counted within the purposes picked, since a total
	// that includes what you have chosen not to show would only puzzle.
	let total = $derived($w_purposes.length === 0 ? 0 : guides.files.filter((g) =>
		$w_purposes.includes(g.is_design ? T_Purpose.designs : T_Purpose.guides)).length);

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

</script>

<Filters />
<div class='count-row'>
	<!-- With nothing left after the filters there are no folders to show or hide, so the
	     button has nothing to act on. -->
	{#if matching > 0}
		<!-- A drawn bar while the folders show; a folder while they are hidden. -->
		<button class='folders-button eye' onclick={toggle_folders} use:tip={$w_show_folders ? 'hide the folders' : 'show the folders'}>
			📁
			{#if !$w_show_folders}
				<svg class='shut-mark' overflow='visible' viewBox='0 0 {MARK} {MARK}'>
					<path d={svg_paths.circle_slash(MARK)} fill-rule='nonzero' />
				</svg>
			{/if}
		</button>
	{/if}
	<!-- What was picked, beside the folder button: the project's short name, then the kind,
	     each held well clear of its neighbors. -->
	{#if $w_project !== ''}
		<span class='chosen-project'>{$w_project}</span>
	{/if}
	{#if $w_kind !== ''}
		<span class='chosen-kind'>{$w_kind}</span>
	{/if}
	<span class='count'>{matching} files (of {total})</span>
	<!-- The picked tags hug the far right, the folders button the far left, and the count
	     keeps the middle of the whole row. -->
	{#if $w_tags.length > 0}
		<span class='chosen-tags' class:has-bar={$w_scrollbar_showing}>{$w_tags.join(', ')}</span>
	{/if}
</div>
<Files />

<style>
	/* The button hugs the far left; the count is placed at the middle of the whole row
	   rather than centered in what the button leaves over, so it never drifts.
	   Pulled 2px closer to the dividers above and below, so the row takes less height. */
	/* The row holds one height whether or not the buttons are in it, so the count and the
	   list below never shift when a button has nothing to act on and leaves. */
	.count-row {
		margin      : calc(var(--gap-small) - 6px) 0 -6px 0;
		min-height  : var(--height-control);
		gap         : var(--gap-tight);
		position    : relative;
		align-items : center;
		display     : flex;
	}

	.count {
		opacity     : var(--opacity-header);
		font-size   : var(--font-label);
		transform   : translateX(-50%);
		position    : absolute;
		white-space : nowrap;
		left        : 50%;
	}

	/* The drawn bar takes the text color, like every other drawn mark. */
	.shut-mark {
		width    : var(--size-control);
		height   : var(--size-control);
		stroke   : var(--black);
		fill     : transparent;
		position : absolute;
		display  : block;
	}

	/* The picked project and kind, reading like the count rather than like buttons. The
	   project stands well clear of the button on its left and the kind on its right. */
	.chosen-project,
	.chosen-tags,
	.chosen-kind {
		opacity     : var(--opacity-header);
		font-size   : var(--font-label);
		color       : var(--text);
		white-space : nowrap;
	}

	.chosen-project {
		margin : 0 var(--gap) 0 calc(var(--gap) - var(--gap-tight));
	}

	/* The tags hug the far right. With the unsorted button beside them they simply follow it;
	   without it they take the far right themselves. */
	.chosen-tags {
		margin-right : var(--gap-fat);
		margin-left  : auto;
	}

	/* With a scrollbar beside the rows, the tags title holds back room for it — so these
	   words hold back the same, and the two end on the same edge. */
	.chosen-tags.has-bar {
		margin-right : calc(var(--thickness-fat) + var(--gap));
	}

	.folders-button {
		border        : var(--thickness-faint) solid var(--black);
		height        : var(--size-control);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(-font-label);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.folders-button:hover {
		background : var(--hover);
	}

	/* The eye is one mark, so its pill is as narrow as it can be while staying round. At
	   rest it wears no edge and sits on the page color; the edge and the fill appear only
	   under the cursor, and the edge is held see-through so nothing shifts. */
	.folders-button.eye {
		width           : var(--size-control);
		position        : relative;
		justify-content : center;
		align-items     : center;
		display         : flex;
		top             : 2px;
		padding         : 0;
	}

	.folders-button.eye:hover {
		border-color : var(--black);
		background   : var(--hover);
	}

</style>
