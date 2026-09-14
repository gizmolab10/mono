<script lang='ts'>
	import { toggle_area, w_areas_open } from '../../ts/managers/Filters';
	import { area_reads, tags_shown } from '../../ts/types/Tag_Areas';
	import { customizations } from '../../ts/common/Customizations';
	import { smooth_height } from '../../ts/common/Core';
	import { Big_Pill } from '../../ts/common/Core';

	// The tag rows of the label form: the same areas the filters use, every tag within reach here,
	// since this is where a file's own tags are set rather than where files are narrowed. The form
	// keeps the tags and writes them; this draws the areas, says which tag was pressed, and says
	// whether the cursor is among them, so the form can light their word.
	//
	// Each area is wrapped so it can be slid: opening one grows it from a word to a run of
	// segments, and the pills after it move a long way at once.
	let { tags, ontoggle, onhover }: {
		tags     : string[];                                                                 // the tags the guide wears
		ontoggle : (tag: string, only?: boolean, among?: string[], everywhere?: boolean) => void;   // a tag pressed, with the ladder's modifiers
		onhover  : (over: boolean) => void;                                                  // the cursor came among the areas, or left
	} = $props();
</script>

<!-- A press on the bare space among the areas shuts them all, which the stack's slot answers; a
     press on an area itself is that area's own. -->
<div class='bare-answers' role='presentation'
	onmouseenter={() => onhover(true)}
	onmouseleave={() => onhover(false)}
	onkeyup={() => {}}>
	<div class='filter-row wrapping tags-row' use:smooth_height>
		{#each customizations.tag_areas as area (area.name)}
			<span class='pill-slot'>
				<Big_Pill row='editor' name={area.name} items={area.tags} shown={tags_shown(area, customizations.tags, tags)}
					reads={area_reads(area, tags)} chosen={tags} {ontoggle}
					ontoggle_area={toggle_area} opened={$w_areas_open} />
			</span>
		{/each}
	</div>
</div>

<style>
	/* A small gap above the tagsets, one gap below. The press on the bare space among them, and
	   the fill that answers the cursor, are the slot's — said in the stack's sections list. */
	.bare-answers {
		padding-top    : var(--gap-small);
		padding-bottom : var(--gap);
	}

	/* The wrapper that carries a pill's slide. It hugs whatever it holds, so the row measures
	   exactly as it did before there was anything to slide. */
	.pill-slot {
		display : inline-flex;
	}

	/* The run always holds a small gap above itself, so a name riding above a pill in the topmost
	   row sits clear of the line overhead. It is a margin, so it sits outside the height this box
	   is told to hold and never joins the slide. Between one row of tags and the next, where they
	   wrap, another small gap: a between-row gap only exists once there is more than one row, so no
	   counting is needed — one row shows none of it. */
	.filter-row.wrapping.tags-row {
		margin-top : var(--gap-small);
		row-gap    : var(--gap-small);
	}

	/* The gap below the tag areas is the section's, not theirs. Wrapped onto more than one row,
	   they stand a full gap apart both ways — the same as the tag areas among the filters.
	   When a pill grows or shrinks enough to take a row of its own, or to give one back, this box
	   changes height and everything under it moves. That change takes the same time the pill
	   itself takes, so the two read as one movement rather than a slide and then a jump. */
	/* The rows keep their own height whatever the box is told to be. Left to stretch, they would
	   grow to fill a stated height — and since that height is worked out from how tall they are,
	   each would make the other larger, over and over. */
	/* Nothing is clipped here: each pill's own name rides above its top edge, so a box that cut
	   off what falls outside it would take the names with it. */
	.filter-row.wrapping {
		transition      : height var(--slide-rows) linear;
		justify-content : center;
		align-content   : flex-start;
		align-items     : center;
		flex-wrap       : wrap;
		display         : flex;
		gap             : var(--gap);
	}
</style>
