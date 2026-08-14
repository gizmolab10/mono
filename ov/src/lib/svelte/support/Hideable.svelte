<script lang='ts'>
	import { T_Edge, USUAL_GAP } from '../../ts/utilities/Sectioning';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { k } from '../../ts/common/Constants';
	import Action, { T_Position } from '../../ts/types/Action';
	import Section from './Section.svelte';

	// One thing in the details column that folds away behind a word on a line — the same shape
	// every other folding thing in the app wears. The word is ours, not the line's: we build it,
	// style it, and hand the made element over; the line only finds it a place to stand.

	// A section gives back half the line above it, since a gap is measured from a line's middle.
	// The details column wants a whole gap drawn between the line and what it shows, so it asks
	// for that half on top of it.
	const COLUMN_GAP = USUAL_GAP + k.thickness.huge / 2;

	let { title, children, edge = T_Edge.thick, gap = COLUMN_GAP, open = $bindable(true) } : {
		title    : string;
		children : import('svelte').Snippet;
		edge?    : T_Edge;      // what bounds it above — the heavy line, by default
		gap?     : number;      // how much it holds around what it shows; 0 makes it stand flat when folded
		open?    : boolean;
	} = $props();

	// The browser makes the button one drawing after we ask, so this holds nothing on the first
	// drawing and the made button on the next — which is itself a change, so the line is told.
	let fold_word: HTMLElement | null = $state(null);
	const to_do = $derived(Object.assign(new Action(), { element: fold_word, position: T_Position.left }));

	function toggle() {
		open = !open;
	}
</script>

<!-- The word that folds this section away, built here rather than by the line it stands on. It is
     written out of sight, since the moment the browser has made it, it is taken and put on the
     line instead. -->
<div class='out_of_sight'>
	<!-- Named by its own title, since the details column holds more than one of these — and by
	     `fold`, since the section it folds carries the title too and one name answers for one
	     thing only. -->
	<button type='button' class='fold-word' bind:this={fold_word}
		use:hit_target={{ id: `details.fold.${title}`, onpress: toggle }}>{title}</button>
</div>

<!-- The gap above what it shows is measured from its own line's middle, so it asks for half that
     line on top of the gap; the gap below is measured against the next line's top edge, so it is
     the plain gap. Equal on both sides once drawn, which is what centers the contents. -->
<Section id={`details.${title}`} {edge} {gap} gap_at_foot={USUAL_GAP} actions={[to_do]} folded={!open}>
	{#snippet holds()}
		{@render children()}
	{/snippet}
</Section>

<style>
	/* Where the fold word is written before the line takes it. It is taken out of here on the
	   very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* The word that folds this section away, standing on the line above. Its page-colored
	   background masks the line behind it. */
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
</style>
