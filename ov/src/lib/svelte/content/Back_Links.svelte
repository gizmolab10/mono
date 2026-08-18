<script lang='ts'>
	import { file_path_of } from '../../ts/utilities/Saving';
	import { T_Edge } from '../../ts/utilities/Sectioning';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { open_view } from '../../ts/managers/Operations';
	import Section from '../support/Section.svelte';
	import { files } from '../../ts/managers/Files';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	// Which guides point at the one being read.
	//
	// A guide says what it points at, and until this nothing said what points at it — so one
	// could be rewritten, moved or thrown away without ever seeing who was relying on it.
	//
	// The gathering is the manager's: every guide's links are taken out of its own text at launch,
	// and where each one leads is answered by the same following that answers a press. This only
	// shows what it worked out, and opens whichever is pressed.
	let { key, name }: {
		key  : string;    // where the guide being read sits
		name : string;    // what it is called, for the log
	} = $props();

	const w_pointing_at = files.w_pointing_at;

	// Named by where each one sits, which is what opens it; what is drawn is its own name.
	//
	// Four files are called lexicon, one to a collection, and a pill carries the name alone — so
	// two of them read as the same button. The folders above each one are carried alongside, for
	// the words shown while the cursor is on it, which is the only place there is space to say
	// which is which.
	const pointing = $derived(($w_pointing_at.get(key) ?? []).map((at) => {
		const found = files.hierarchy.all_files.get(at)?.file;
		const whole = found ? file_path_of(found.bundle, found.path) : at;
		return {
			at,
			name    : found?.name ?? at,
			ancestry: whole.slice(0, whole.lastIndexOf('/')),
		};
	}));

	function open(at: string) {
		debug.log(`Back links: opening "${at}", one of the ${pointing.length} guide(s) that point at "${name}".`);
		open_view(at);
	}
</script>

<!-- A section of its own, with no word on its line — the pills say what it is. Nothing at all is
     drawn where nothing points here, since an empty section reads as something still being worked
     out and takes space from the words above it. -->
{#if pointing.length > 0}
	<!-- A gap is measured from the middle of the line above and half that line is given back, so
	     a plain gap would begin the pills at its very edge. Half the heavy line is asked for on
	     top, which puts a whole gap of clear space between the line and them.

	     It holds no gap below its own pills: the box these stand in already holds one at its
	     foot, and the two together read as twice the gap every other pair holds. -->
	<Section id='editor.backlinks' gap={k.gap.normal + k.thickness.huge / 2} gap_at_foot={0} edge={T_Edge.thick}>
		{#snippet contents()}
			<div class='back-links'>
				{#each pointing as one (one.at)}
					<button type='button' class='points'
						use:hit_target={{ id: `backlink.${one.at}`, onpress: () => open(one.at),
							tip: `open "${one.name}" in ${one.ancestry}` }}>{one.name}</button>
				{/each}
			</div>
		{/snippet}
	</Section>
{/if}

<style>
	/* The run of pills. The section holds the gap above and below them; this holds only the gap
	   between one and the next, and wraps where there are more than a line's worth. */
	.back-links {
		gap             : var(--gap);
		justify-content : center;
		align-items     : center;
		flex-wrap       : wrap;
		display         : flex;
	}

	/* Each one a pill, the same as every other word that can be pressed. */
	.points {
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		height        : var(--height);
		padding       : 0 var(--gap);
		color         : var(--text);
		box-sizing    : border-box;
		background    : var(--bg);
		font-family   : inherit;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.points:global([data-hit]) {
		border-color : var(--darkgray);
		background   : var(--hover);
	}
</style>
