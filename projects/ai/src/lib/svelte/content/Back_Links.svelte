<script lang='ts'>
	import { preferences, T_Preference, file_path_of, open_view, files } from '../../ts/common/Kb';
	import { Action, T_Position, T_Edge, hit_target, Section, Separator, debug, k } from '../../ts/common/Core';

	// Which files point at the one being read, ai's since step 14 of the plan, handed to kb as the
	// back links and rendered at the foot of its editor frame.
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

	// Whether the pills are on screen at all. Remembered across visits, since it is a way of
	// working rather than something about one guide.
	const w_show_backlinks = preferences.persistent<boolean>(T_Preference.show_backlinks, true);

	// Shown, the clickable is just "back links". Folded, it says how many point here, so a guide
	// that something relies on never looks like one nothing does.
	let backlinks_word = $derived($w_show_backlinks ? 'back links' : `back links ➜ ${pointing.length}`);

	// The clickable that folds these away. Built out of sight here and handed to the line at the
	// section's foot, below the pills since 15 September 2026, which only finds it a place to
	// stand — the browser makes it one drawing after we ask, so this holds nothing on the first
	// drawing and the made button on the next.
	let clickable = $state<HTMLElement | null>(null);
	const to_fold = $derived(Object.assign(new Action(), { element: clickable, position: T_Position.left }));

	/** Put the pills away, or bring them back. */
	function toggle_backlinks() {
		w_show_backlinks.set(!$w_show_backlinks);
		debug.log(`Reading "${name}": the back links are now ${!$w_show_backlinks ? 'folded away' : 'shown'}.`);
	}

	// Said whenever the guide, what points at it, or the fold changes: what is drawn here, or why
	// nothing is.
	$effect(() => {
		debug.log(`Back links: ${pointing.length} guide(s) point at "${name}" at ${key}, so the section is ${pointing.length === 0 ? 'not drawn' : $w_show_backlinks ? 'drawn and shown' : 'drawn and folded'}.`);
	});

	function open(at: string) {
		debug.log(`Back links: opening "${at}", one of the ${pointing.length} guide(s) that point at "${name}".`);
		open_view(at);
	}
</script>

<!-- The run of pills alone; the section of its own below draws the line, the gap and the
     clickable around them. -->
{#snippet pills()}
	<div class='back-links'>
		{#each pointing as one (one.at)}
			<button type='button' class='points'
				use:hit_target={{ id: `backlink.${one.at}`, onpress: () => open(one.at),
					tip: `open "${one.name}" in ${one.ancestry}` }}>{one.name}</button>
		{/each}
	</div>
{/snippet}

{#if pointing.length > 0}
	<!-- A section of its own, the clickable that folds the pills away riding the line at its foot.
	     Nothing at all is drawn where nothing points here, since an empty section reads as something
	     still being worked out and takes space from the contents above it. -->
	<!-- Where the clickable is written before the line takes it. It is taken out of here on the
	     very next drawing, so nothing is ever seen in this spot. -->
	<div class='out_of_sight'>
		<button type='button' class='clickable' bind:this={clickable}
			use:hit_target={{ id: 'editor.fold.backlinks', onpress: toggle_backlinks,
				tip: 'which files point at this one' }}>{backlinks_word}</button>
	</div>
	<!-- A gap is measured from the middle of the line above and half that line is given back, so
	     a plain gap would begin the pills at its very edge. Half the heavy line is asked for on
	     top, which puts a whole gap of clear space between the line and them.

	     It holds no gap below its own pills: the box these stand in already holds one at its
	     foot, and the two together read as twice the gap every other pair holds. -->
	<!-- Folded, it is a band of accent at the very foot of the view, a faint gap more than the
	     usual folded height, reaching a fat gap down over the gap the region holds below the view,
	     so no page color shows under it, its hairline at its middle. Its line is the heavy one
	     while the pills show, and none while they are folded away, since 18 September 2026: the
	     foot line alone bounds the folded band. -->
	<div class='foot' class:folded={!$w_show_backlinks}>
		<Section id='editor.backlinks' gap_at_foot={0}
			edge={$w_show_backlinks ? T_Edge.thick : T_Edge.view}
			extra_when_folded={k.gap.faint}
			folded={!$w_show_backlinks}
			gap={k.gap.normal + k.thickness.huge / 2}>
			{#snippet contents()}{@render pills()}{/snippet}
		</Section>
		<!-- The foot line, the thin one, carrying the clickable, drawn whether the pills show or are
		     folded away, so the word that brings them back is always there to press. -->
		<div class='foot-line'>
			<Separator thickness={k.thickness.normal} actions={[to_fold]} />
		</div>
	</div>
{/if}

<style>
	/* Where the clickable is written before the line takes it. */
	.out_of_sight {
		display : none;
	}

	/* Folded, the band reaches down over the gap the region holds below the view. */
	.foot.folded {
		margin-bottom : calc(var(--gap-fat) * -1);
	}

	/* The foot line sits a gap below the pills. Folded, the band reaches a fat gap lower, so the
	   line pulls up by that much and its word keeps its place, since 15 September 2026. */
	.foot-line {
		position : relative;
		top      : var(--gap);
	}

	.foot.folded .foot-line {
		top : calc(var(--gap) - var(--gap-fat));
	}

	/* The clickable that folds this section away, standing on the line above it. Its white
	   background masks the line behind it. The edge is held see-through and counted inside its own
	   space, so the hover edge adds no width and it never shifts. */
	.clickable {
		border        : var(--thick-faint) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		color         : var(--darkgray);
		padding       : 0 var(--gap);
		background    : var(--white);
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
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		font-family   : inherit;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.points:global([data-hit]) {
		border-color : var(--darkgray);
		background   : var(--hover);
	}
</style>
