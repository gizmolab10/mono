<script lang='ts'>
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { file_path_of } from '../../ts/utilities/Saving';
	import Action, { T_Position } from '../../ts/types/Action';
	import { T_Edge } from '../../ts/utilities/Sectioning';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { open_view } from '../../ts/managers/Operations';
	import Section from '../support/Section.svelte';
	import { files } from '../../ts/managers/Files';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Core';

	// Which guides point at the one being read.
	//
	// A guide says what it points at, and until this nothing said what points at it — so one
	// could be rewritten, moved or thrown away without ever seeing who was relying on it.
	//
	// The gathering is the manager's: every guide's links are taken out of its own text at launch,
	// and where each one leads is answered by the same following that answers a press. This only
	// shows what it worked out, and opens whichever is pressed.
	let { key, name, bare = false }: {
		key  : string;    // where the guide being read sits
		name : string;    // what it is called, for the log
		bare?: boolean;   // stand as somebody else's subsection: no section, no line, no clickable — they draw those
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

	// Whether the pills are on screen at all. Remembered across visits, since it is a way of
	// working rather than something about one guide.
	const w_show_backlinks = preferences.persistent<boolean>(T_Preference.show_backlinks, true);

	// Shown, the clickable is just "back links". Folded, it says how many point here, so a guide
	// that something relies on never looks like one nothing does.
	let backlinks_word = $derived($w_show_backlinks ? 'back links' : `back links ➜ ${pointing.length}`);

	// The clickable that folds these away. Built out of sight here and handed to the line, which
	// only finds it a place to stand — the browser makes it one drawing after we ask, so this
	// holds nothing on the first drawing and the made button on the next.
	let clickable = $state<HTMLElement | null>(null);
	const to_fold = $derived(Object.assign(new Action(), { element: clickable, position: T_Position.left }));

	/** Put the pills away, or bring them back. */
	function toggle_backlinks() {
		w_show_backlinks.set(!$w_show_backlinks);
		debug.log(`Reading "${name}": the back links are now ${!$w_show_backlinks ? 'folded away' : 'shown'}.`);
	}

	function open(at: string) {
		debug.log(`Back links: opening "${at}", one of the ${pointing.length} guide(s) that point at "${name}".`);
		open_view(at);
	}
</script>

<!-- The run of pills alone. What is drawn around them depends on who places this: bare, the
     holder draws the line, the gap and the clickable; alone, a section of its own below. -->
{#snippet pills()}
	<div class='back-links'>
		{#each pointing as one (one.at)}
			<button type='button' class='points'
				use:hit_target={{ id: `backlink.${one.at}`, onpress: () => open(one.at),
					tip: `open "${one.name}" in ${one.ancestry}` }}>{one.name}</button>
		{/each}
	</div>
{/snippet}

{#if bare}
	{#if pointing.length > 0}{@render pills()}{/if}
{:else if pointing.length > 0}
	<!-- A section of its own, its line carrying the clickable that folds the pills away. Nothing at
	     all is drawn where nothing points here, since an empty section reads as something still being
	     worked out and takes space from the contents above it. -->
	<!-- Where the clickable is written before the line takes it. It is taken out of here on the
	     very next drawing, so nothing is ever seen in this spot. -->
	<div class='out_of_sight'>
		<button type='button' class='clickable' bind:this={clickable}
			use:hit_target={{ id: 'editor.fold.backlinks', onpress: toggle_backlinks,
				tip: 'which guides point at this one' }}>{backlinks_word}</button>
	</div>
	<!-- A gap is measured from the middle of the line above and half that line is given back, so
	     a plain gap would begin the pills at its very edge. Half the heavy line is asked for on
	     top, which puts a whole gap of clear space between the line and them.

	     It holds no gap below its own pills: the box these stand in already holds one at its
	     foot, and the two together read as twice the gap every other pair holds. -->
	<!-- Folded, it asks for one heavy line less than the usual folded height: what it holds away
	     is a run of pills at the very foot of the view, and the usual fold leaves the two lines
	     further apart down there than they read anywhere else. -->
	<Section id='editor.backlinks' gap={k.gap.normal + k.thickness.huge / 2} gap_at_foot={0}
		extra_when_folded={-k.thickness.huge} accent_when_folded
		edge={T_Edge.thick} actions={[to_fold]} folded={!$w_show_backlinks}>
		{#snippet contents()}{@render pills()}{/snippet}
	</Section>
{/if}

<style>
	/* Where the clickable is written before the line takes it. */
	.out_of_sight {
		display : none;
	}

	/* The clickable that folds this section away, standing on the line above it. Its page-colored
	   background masks the line behind it. The edge is held see-through and counted inside its own
	   space, so the hover edge adds no width and it never shifts. */
	.clickable {
		background    : var(--section-bg, var(--bg));
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		color         : var(--darkgray);
		padding       : 0 var(--gap);
		box-sizing    : border-box;
		font-family   : inherit;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.clickable:global([data-hit]) {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

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
