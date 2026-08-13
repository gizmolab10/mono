<script lang='ts'>
	import { w_show_folders, w_show_filters, w_sorts, w_kind, w_project, w_tags } from '../../ts/managers/Filters';
	import Files, { w_first_column, w_scrollbar_showing } from '../content/Files.svelte';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { T_Edge } from '../../ts/utilities/Sectioning';
	import List_Filters from '../content/List_Filters.svelte';
	import { guides } from '../../ts/managers/Files';
	import { tip } from '../../ts/utilities/Tooltip';
	import Section from '../support/Section.svelte';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	// How wide the drawn bar runs — the same size the folder triangles use.
	const MARK = k.size.normal;

	// Looking through the guides: the three filters across the top, how many they leave,
	// and the list itself. The narrowing happens in the hierarchy; this only shows it.
	const w_showing = guides.w_showing;

	// How many guides the filters leave — counted before the folds, so shutting a folder
	// hides its files from the list without changing what the count says.
	let matching = $derived.by(() => { $w_showing; return guides.hierarchy.matched_count; });
	// How many there are to be had at all.
	let total = $derived(guides.files.length);

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

<!-- The three parts stack flush against each other: each already holds its own gap above and
     below what it shows, so a gap here would be a second helping of the same thing. -->
<div class='browse'>
<List_Filters />
<!-- How many the filters leave, as a section of its own. The heavy line above it is what closes
     the picking rows off from the list; with those rows folded away there is nothing for it to
     close, so this section stands at an edge of the view instead and draws no line at all. -->
<Section
	gap={k.gap.normal}
	edge={$w_show_filters ? T_Edge.thick : T_Edge.view}>
	{#snippet holds()}
		<div class='count-row'>
			<!-- With nothing left after the filters there are no folders to show or hide, so the
				button has nothing to act on. -->
			{#if matching > 0}
				<!-- It stands in a lane as wide as the list's first column, held to that lane's right
					end and inset by the same gap the first title holds — so the button's right edge
					falls exactly where the first title's words end. With no fixed first column there
					is nothing to line up with, so the lane collapses and it hugs the far left. -->
				<span class='folders-lane' style:width='{$w_first_column}px'>
					<!-- A drawn bar while the folders show; a folder while they are hidden. -->
					<!-- With a project and a kind both picked and the folders hidden, the lane is too
						narrow to hold the button and its left end runs off the edge, so it is moved
						back into view. -->
					<button class='folders-button eye'
						class:crowded={$w_kind !== ''}
						onclick={toggle_folders} use:tip={$w_show_folders ? 'hide the folders' : 'show the folders'}>
						📁
						{#if !$w_show_folders}
							<svg class='shut-mark' overflow='visible' viewBox='0 0 {MARK} {MARK}'>
								<path d={svg_paths.circle_slash(MARK)} fill-rule='nonzero' />
							</svg>
						{/if}
					</button>
				</span>
			{/if}
			<!-- What was picked, beside the folder button: the project's short name, then the kind,
				each held well clear of its neighbors. -->
			{#if $w_project !== ''}
				<span class='chosen-project'>{$w_project}</span>
			{/if}
			<!-- An upright line stands between them, but only while both are picked. -->
			{#if $w_project !== '' && $w_kind !== ''}
				<span class='chosen-between'>|</span>
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
	{/snippet}
</Section>
<Files />
</div>

<style>
	.browse {
		flex-direction : column;
		display        : flex;
		min-height     : 0;
		flex           : 1;
		gap            : 0;
	}

	/* The button hugs the far left; the count is placed at the middle of the whole row
	   rather than centered in what the button leaves over, so it never drifts. */
	/* The row holds one height whether or not the buttons are in it, so the count and the
	   list below never shift when a button has nothing to act on and leaves. Nothing of its
	   own above or below — the gap on both sides is the section's — and it stands exactly as
	   tall as the folders button, so the section is that button and one gap either side. */
	.count-row {
		min-height  : var(--size);
		gap         : var(--gap-tiny);
		position    : relative;
		align-items : center;
		display     : flex;
	}

	.count {
		opacity     : var(--opacity-header);
		font-size   : var(--font-tiny);
		transform   : translateX(-50%);
		position    : absolute;
		white-space : nowrap;
		left        : 50%;
	}

	/* The drawn bar takes the text color, like every other drawn mark. */
	.shut-mark {
		width    : var(--size);
		height   : var(--size);
		stroke   : var(--black);
		fill     : transparent;
		position : absolute;
		display  : block;
	}

	/* The picked project and kind, reading like the count rather than like buttons. The
	   project stands well clear of the button on its left and the kind on its right. */
	.chosen-project,
	.chosen-between,
	.chosen-tags,
	.chosen-kind {
		opacity     : var(--opacity-header);
		font-size   : var(--font-tiny);
		color       : var(--text);
		white-space : nowrap;
	}

	.chosen-project {
		margin : 0 0 0 var(--gap-tiny);
	}

	/* Nothing of its own either side, so the row's own spacing falls equally on both — the
	   line then stands in the middle of the space between the two words. */
	.chosen-between {
		margin : var(--gap-tiny);
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
		margin-right : calc(var(--thick-fat) + var(--gap));
	}

	/* The lane the folders button sits in, as wide as the list's first column. The button is held
	   to its right end and inset by the gap the first title holds, so the two right edges agree. */
	.folders-lane {
		padding-right   : var(--gap-fat);
		box-sizing      : border-box;
		justify-content : flex-end;
		flex            : 0 0 auto;
		align-items     : center;
		display         : flex;
	}

	.folders-button {
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(-font-label);
		background    : var(--white);
		height        : var(--size);
		color         : var(--text);
		box-sizing    : border-box;
		cursor        : pointer;
		white-space   : nowrap;
	}

	/* Moved rather than given space: the lane holds the button to its right end, so anything that
	   changes the button's own size leaves its left end exactly where it was. */
	.folders-button.crowded {
		transform : translateX(var(--gap-fat));
	}

	.folders-button:hover {
		background : var(--hover);
	}

	/* The eye is one mark, so its pill is as narrow as it can be while staying round. At
	   rest it wears no edge and sits on the page color; the edge and the fill appear only
	   under the cursor, and the edge is held see-through so nothing shifts. */
	.folders-button.eye {
		width           : var(--size);
		position        : relative;
		justify-content : center;
		align-items     : center;
		display         : flex;
		padding         : 0;
	}

	.folders-button.eye:hover {
		border-color : var(--black);
		background   : var(--hover);
	}

</style>
