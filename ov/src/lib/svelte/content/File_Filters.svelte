<script lang='ts'>
	import { with_labels_replaced } from '../../ts/utilities/Labels';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { ALL_TAGS, T_Kind, in_order, type Guide } from '../../ts/types/File';
	import { file_path_of, save_guide } from '../../ts/utilities/Saving';
	import { over_empty } from '../../ts/utilities/Hit_Empty_Space';
	import { smooth_height } from '../../ts/utilities/Smooth_Height';
	import { inverted, toggle_all_areas, w_areas_open } from '../../ts/managers/Filters';
	import { names_ride_in, places_of } from '../../ts/utilities/Tag_Rows';
	import Action, { T_Position } from '../../ts/types/Action';
	import { TAG_AREAS } from '../../ts/types/Tag_Areas';
	import Section from '../support/Section.svelte';
	import { T_Edge } from '../../ts/utilities/Sectioning';
	import Big_Pill from '../support/Big_Pill.svelte';
	import { guides } from '../../ts/managers/Files';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';

	// What a guide is labeled: its title, its date, the line saying what it is for, its one kind,
	// and its tags. The labels are never on the page — they are taken off before the words are
	// drawn — so this is where they are read and changed. Nothing here is typed as free text
	// where it matters: the kind and the tags are picked from the only lists the app accepts.

	let {
		name, guide, tags, text = $bindable(''), way_out_lit = $bindable(false),
		folded = $bindable(false), onclose, onsay,
	}: {
		name        : string;                // what the file is called
		guide       : Guide;                 // the record of the file being read
		tags        : string[];              // the tags it wears right now
		text        : string;                // the whole file, which a write here changes
		way_out_lit : boolean;               // the way back to the list is lit, here and in the row above
		folded      : boolean;               // the whole form is put away, told outward so the words below know their line has nothing to stand under
		onclose     : () => void;            // back to the list
		onsay       : (words: string) => void;  // something to tell the reader, briefly
	} = $props();

	let form_kind        = $state('');
	let form_title       = $state('');
	let form_description = $state('');
	let form_date        = $state('');
	let form_tags        = $state<string[]>([]);
	let tags_lit         = $state(false);   // the cursor is among the tag areas, so their own word lights
	const KINDS = Object.values(T_Kind);

	// Whether the form is on screen at all. Remembered across visits, since it is a way of
	// working rather than something about one guide.
	const w_show_filters = preferences.persistent<boolean>(T_Preference.show_filters, true);

	// Said outward, so whoever stacks this knows the form is away and its own line would stand
	// on the line above with nothing between them.
	$effect(() => { folded = !$w_show_filters; });

	// The tag areas take four rows of their own, so the word above them folds them away — and
	// says what the guide wears while they are gone, as the filters' own lines do.
	let show_form_tags = $state(true);
	let form_tags_word = $derived(show_form_tags ? 'tags'
		: `tags ➜ ${form_tags.length === 0 ? 'none' : [...form_tags].sort(in_order).join(', ')}`);

	// The seven kinds take a row of their own, folded away the same way — and folded, the word
	// says which one the guide is, so a kind is never hidden without a sign of it.
	let show_form_kinds = $state(true);
	let form_kinds_word = $derived(show_form_kinds ? 'kinds'
		: `kinds ➜ ${form_kind === '' ? 'none' : form_kind}`);

	// The word on the line above the form folds the whole form away. With the form on screen it
	// is just the one word; folded, it says what the file is filtered, since that is the only
	// place left to read it.
	let filter_rows_word = $derived($w_show_filters ? '✂ filters'
		: `✂ filters ➜ ${[form_kind, ...[...form_tags].sort(in_order)]
			.filter((one) => one !== '').join(', ') || 'none'}`);

	// The three words that fold these sections away are ours, not the lines'. Each is built as a
	// button below, out of sight; the browser makes it one drawing after we ask, so each of these
	// holds nothing on the first drawing and the made button on the next — which is itself a
	// change, so the line it stands on is told at once.
	let filters_button = $state<HTMLElement | null>(null);
	let kinds_button   = $state<HTMLElement | null>(null);
	let tags_button    = $state<HTMLElement | null>(null);

	// The two presses that change which tags the guide wears. They stand on the tags line at the
	// middle, beside the word that folds the areas rather than inside what that word folds away.
	let picking_control = $state<HTMLElement | null>(null);

	const filters_action = $derived(Object.assign(new Action(), { element: filters_button, position: T_Position.left }));
	const kinds_action   = $derived(Object.assign(new Action(), { element: kinds_button,   position: T_Position.left }));
	const tags_action    = $derived(Object.assign(new Action(), { element: tags_button,    position: T_Position.left }));
	const picking_action = $derived(Object.assign(new Action(), { element: picking_control, position: T_Position.center }));

	// Does a name ride above a pill in the topmost row of tags? Only then does the row hold a gap
	// above itself, so that name stands clear of the line overhead.
	let tags_row = $state<HTMLElement | null>(null);
	let names_riding = $state(false);


	function look_for_names() {
		names_riding = tags_row === null ? false : names_ride_in(places_of(tags_row));
	}

	// Measured again whenever the picks change, and again whenever the run changes shape — it
	// wraps differently at a different width, and a pill opening slides its neighbors onto
	// another line partway through.
	$effect(() => {
		form_tags; $w_areas_open; show_form_tags;
		look_for_names();
		const row = tags_row;
		if (!row) { return; }
		const watcher = new ResizeObserver(look_for_names);
		watcher.observe(row);
		for (const pill of [...row.children]) { watcher.observe(pill); }
		return () => watcher.disconnect();
	});

	/** Put the whole form away, or bring it back. */
	function toggle_filters() {
		w_show_filters.set(!$w_show_filters);
		debug.log(`Editing "${name}": the filter form is now ${!$w_show_filters ? 'hidden' : 'shown'}.`);
	}

	/** Put the kinds row away, or bring it back. */
	function toggle_kinds() {
		show_form_kinds = !show_form_kinds;
		debug.log(`Editing "${name}": the kinds row is now ${show_form_kinds ? 'shown' : 'folded away'}.`);
	}

	/** Put the tag areas away, or bring them back. */
	function toggle_tags() {
		show_form_tags = !show_form_tags;
		debug.log(`Editing "${name}": the tag areas are now ${show_form_tags ? 'shown' : 'folded away'}.`);
	}

	// Whenever another guide comes on screen, the form starts from what that guide says.
	$effect(() => {
		form_kind        = guide.kind;
		form_title       = guide.title;
		form_description = guide.description;
		form_date        = guide.date;
		form_tags        = [...tags];
	});

	function leave_if_empty(event: MouseEvent) {
		if (!over_empty(event)) { return; }
		debug.log(`Editing "${name}": pressed the empty part of a top row — back to the list.`);
		onclose();
	}

	/** Write the five filters back, if any of them changed. */
	function save_filters() {
		if (text === '') { return; }
		const filters = { kind: form_kind, title: form_title, description: form_description, date: form_date, labeled: true };
		const whole  = with_labels_replaced(text, filters, form_tags);
		if (whole === text) { return; }
		const was   = text;
		const where = file_path_of(guide.bundle, guide.path);
		debug.log(`Editing "${name}": the filters changed — writing them to ${where}.`);
		text = whole;                         // the words below are untouched, so no redraw
		save_guide(where, whole, was).then((answer) => {
			debug.log(`Editing "${name}": the answer came back — ${answer.ok ? 'written' : `refused, ${answer.why}`}.`);
			if (!answer.ok) {
				text = was;
				onsay(`not saved — ${answer.why}`);
				debug.log(`Editing "${name}": the filters were NOT written to ${where} — ${answer.why}.`);
				return;
			}
			// The list shows the title and the tags, so it is told at once rather than
			// waiting for every file to be read again. A fault here would leave the file
			// written and the app still holding the old labels, so it is said out loud.
			try {
				guides.relabel(guide, filters, form_tags);
			} catch (trouble) {
				onsay('written, but the list was not told');
				debug.log(`Editing "${name}": ${where} was written, but telling the list failed — ${String(trouble)}. The app still holds the old labels.`);
				return;
			}
			debug.log(`Editing "${name}": filters written — kind "${filters.kind}", ${form_tags.length} tag(s).`);
		});
	}

	/** Put a tag on this guide or take it off, and write it. */
	function toggle_tag(tag: string) {
		form_tags = form_tags.includes(tag) ? form_tags.filter((t) => t !== tag) : [...form_tags, tag].sort(in_order);
		save_filters();
	}

	/** Take every tag off this guide, and write it. */
	function clear_tags() {
		debug.log(`Editing "${name}": all ${form_tags.length} tag(s) taken off.`);
		form_tags = [];
		save_filters();
	}

	/**
	 * Give this guide exactly the tags it did not wear, and write it. Every tag on the closed list
	 * is on offer here, since this is where a file's own tags are set.
	 */
	function invert_tags() {
		form_tags = inverted(ALL_TAGS, form_tags).sort(in_order);
		debug.log(`Editing "${name}": the tags turned over — it now wears ${form_tags.length} of the ${ALL_TAGS.length}.`);
		save_filters();
	}
</script>

<!-- Folded, the section's own empty area joins the way back to the list: it is bare space above
     the file's words, the same as the two top rows, and it lights with them. Open, the rows
     inside answer for themselves and this stands aside. -->
<!-- The three words that fold these sections away, built here rather than by the lines they stand
     on. Each is written out of sight, since the moment the browser has made it, it is taken and
     put on its line instead. -->
<div class='out_of_sight'>
	<button type='button' class='fold-word' class:forced={way_out_lit}
		bind:this={filters_button} onclick={toggle_filters}>{filter_rows_word}</button>
	<button type='button' class='fold-word' class:forced={way_out_lit}
		bind:this={kinds_button} onclick={toggle_kinds}>{form_kinds_word}</button>
	<button type='button' class='fold-word' class:forced={tags_lit || way_out_lit}
		bind:this={tags_button} onclick={toggle_tags}>{form_tags_word}</button>
	<!-- Two presses. Neither is a state — a guide wears the tags it wears — so neither ever reads
	     as picked; they answer under the cursor only. -->
	<span class='picking' bind:this={picking_control}>
		<button class='segment press' onclick={clear_tags}
			use:tip={'take every tag off this guide'}>clear</button>
		<button class='segment press' onclick={invert_tags}
			use:tip={'give it exactly the tags it does not wear'}>invert</button>
	</span>
</div>

<div class='filter-block' class:lit={way_out_lit && !$w_show_filters}
	role='button' tabindex='-1' onkeyup={() => {}}
	onmousemove={(e) => { if (!$w_show_filters) { way_out_lit = over_empty(e); } }}
	onmouseleave={() => { if (!$w_show_filters) { way_out_lit = false; } }}
	use:tip={$w_show_filters ? false : 'back to browse'}
	onclick={(e) => { if (!$w_show_filters) { leave_if_empty(e); } }}>
<!-- What the guide is labeled, as a section of its own: its line carries the word that folds
     the whole form away, and holds three subsections — the words, the kinds, the tags.

     It asks for no gap at all, which is how a section says it should stand flat when folded: the
     words below come straight up under its line, and the line that would have stood under it is
     left undrawn. Its own children hold the gap while it is open, so the number is unused then. -->
<Section
	holds_subsections
	gap={0}
	edge={T_Edge.thick}
	actions={[filters_action]}
	folded={!$w_show_filters}>
	{#snippet holds()}
	<!-- The bare space among the label rows is another way back to the list, the same as the
	     top block — and the two light together, since they are one way out. It stops at the
	     line above the tags: a press on the tags' own bare space already means something. -->
	<div class='filter-form'>
		<div class='label-rows' role='button' tabindex='-1' onkeyup={() => {}}
			onmousemove={(e) => { way_out_lit = over_empty(e); }}
			onmouseleave={() => { way_out_lit = false; }}
			class:lit={way_out_lit}
			use:tip={'back to browse'} onclick={leave_if_empty}>
			<!-- What a guide says about itself in words: its title, its date, and one line
			     saying what it is for. They sit closer together than sections do, since they
			     are rows of one thing rather than things of their own. -->
			<div class='word-rows'>
				<div class='filter-row'>
					<span class='filter-word'>title</span>
					<input class='filter-field' bind:value={form_title} onblur={save_filters} />
					<span class='filter-word'>date</span>
					<input class='filter-field date' bind:value={form_date} onblur={save_filters} />
				</div>
				<div class='filter-row'>
					<span class='filter-word'>brief</span>
					<input class='filter-field' bind:value={form_description} onblur={save_filters} />
				</div>
			</div>
			<!-- The kinds, as a section of their own: its line carries the word that folds them
			     away and then says which kind the guide is. -->
			<Section
				actions={[kinds_action]}
				folded={!show_form_kinds}>
				{#snippet holds()}
					<!-- No word beside them: the line above already says what they are. -->
					<div class='filter-row wrapping'>
						{#each KINDS as one (one)}
							<button class='filter-pick' class:on={form_kind === one} onclick={() => { form_kind = one; save_filters(); }}>{one}</button>
						{/each}
					</div>
				{/snippet}
			</Section>
		</div>
		<!-- The tags, as a section of their own: its line carries the word that folds them
		     away, and the section holds the gap around them. The word lights with every
		     other one that can be pressed — while the way back to the list is lit, and while
		     the cursor is among the tags themselves. -->
		<Section
			actions={[tags_action, picking_action]}
			fills_when_bare
			onbare={() => toggle_all_areas(TAG_AREAS.map((one) => one.name))}
			bare_says={$w_areas_open.length === 0 ? 'expand tags' : 'collapse tags'}
			folded={!show_form_tags}
			onhover={(over) => { tags_lit = over; }}>
			{#snippet holds()}
				<!-- The same areas the filters use. Every tag is within reach here, since this
				     is where a file's own tags are set rather than where files are narrowed.
				     A press on the bare space among them shuts them all; a press on an area
				     itself is that area's own. -->
				<!-- Each area is wrapped so it can be slid: opening one grows it from a word to a
				     run of segments, and the pills after it move a long way at once. -->
				<div class='filter-row wrapping tags-row' class:named={names_riding}
					bind:this={tags_row} use:smooth_height>
					{#each TAG_AREAS as area (area.name)}
						<span class='pill-slot'>
							<Big_Pill {area} in_reach={ALL_TAGS} chosen={form_tags} ontoggle={toggle_tag} />
						</span>
					{/each}
				</div>
			{/snippet}
		</Section>
	</div>
	{/snippet}
</Section>
</div>

<style>
	/* Where the three fold words are written before their lines take them. Each is taken out of
	   here on the very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* A word that folds its section away, standing on the line above it. Its page-colored
	   background masks the line behind it. The edge is held see-through and counted inside the
	   word's own space, so the hover edge adds no width and the word never shifts. */
	.fold-word {
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

	/* The edge appears under the cursor, or because the area around it says so. Told to light
	   from outside, it takes white — it reads as marked without claiming the cursor. */
	.fold-word:hover {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

	.fold-word.forced {
		border-color : var(--darkgray);
		background   : var(--bg);
	}

	/* Folded, this whole block is bare space above the file's words, so it is a way back to the
	   list and lights with the two rows above it. It reaches out to the box's left and right
	   edges, the way those rows do, so the lit color covers the gap the box holds around its
	   contents rather than stopping short. */
	.filter-block {
		margin         : 0 calc(var(--gap) * -1);
		padding        : 0 var(--gap);
		flex-direction : column;
		display        : flex;
	}

	.filter-block.lit {
		background : var(--hover);
		cursor     : pointer;
	}

	.filter-form {
		flex-direction : column;
		display        : flex;
		gap            : 0;
	}

	/* The label rows, taken as one block — the part of the form that is a way back to the list. It
	   reaches out to the box's left and right edges and up to the line above it, so the lit color
	   covers the gap the box holds around its contents rather than stopping short. It ends at the
	   line above the tags, which is where the way out ends. */
	/* Below its last row it holds the gap that stands between it and the tags line — the set's own
	   spacing plus the line's — and gives that gap straight back, so the color reaches the line
	   while the line itself stays where it is. */
	.label-rows {
		margin         : 0 calc(var(--gap) * -1);
		padding        : var(--gap) var(--gap) 0;
		flex-direction : column;
		cursor         : pointer;
		display        : flex;
		gap            : 0;
	}

	/* Rows of one thing, so they sit closer together than sections do. Not a section itself, so
	   it holds its own gap below — the gap a section's line would otherwise stand clear of. */
	.word-rows {
		padding-bottom : var(--gap);
		gap            : var(--gap-tiny);
		flex-direction : column;
		display        : flex;
	}

	.label-rows.lit {
		background : var(--hover);
	}

	/* The wrapper that carries a pill's slide. It hugs whatever it holds, so the row measures
	   exactly as it did before there was anything to slide. */
	.pill-slot {
		display : inline-flex;
	}

	/* The two presses, standing on the tags line beside the word that folds the areas. They take
	   that word's size — the same text and the same edge thickness, which makes both boxes the
	   same height. Their height is whatever that text needs; nothing is fixed. */
	.picking {
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		background    : var(--white);
		box-sizing    : border-box;
		align-items   : stretch;
		overflow      : hidden;
		display       : inline-flex;
		flex-shrink   : 0;
	}

	/* A button keeps no text size of its own, so it is said here — without it each segment falls
	   back to whatever the browser draws a button at, which is larger than the word beside it. */
	.picking .segment {
		font-size  : var(--font-faint);
		padding    : 0 var(--gap);
		background : transparent;
		color      : var(--text);
		cursor     : pointer;
		white-space: nowrap;
		border     : none;
	}

	.picking .segment:not(:last-child) {
		border-right : var(--thick) solid var(--black);
	}

	/* Neither is a state, so each takes the fill only under the cursor and a stronger one
	   while it is held. */
	.picking .segment.press:hover {
		background : var(--hover);
	}

	.picking .segment.press:active {
		color      : var(--text-on-accent);
		background : var(--accent);
	}

	.filter-row {
		gap         : var(--gap-tiny);
		align-items : center;
		display     : flex;
	}

	/* With a name riding above a pill in the topmost row, the run holds one gap above itself so
	   that name stands clear of the line overhead. It is a margin, so it sits outside the height
	   this box is told to hold and never joins the slide. */
	.tags-row.named {
		margin-top : var(--gap);
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
		gap             : var(--gap);
	}

	.filter-word {
		opacity    : var(--opacity-header);
		font-size  : var(--font-tiny);
		color      : var(--text);
		flex       : 0 0 auto;
		text-align : right;
		width      : 45px;
	}

	.filter-field {
		border        : var(--thick) solid var(--black);
		padding       : var(--pad-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-tiny);
		height        : var(--height);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		flex          : 1 1 auto;
		font-family   : inherit;
		min-width     : 0;
	}

	.filter-field.date {
		flex  : 0 0 auto;
		width : 110px;
	}

	.filter-pick {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-tiny);
		height        : var(--height);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		flex          : 0 0 auto;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.filter-pick:hover {
		background : var(--hover);
	}

	.filter-pick.on {
		background : var(--accent);
	}
</style>
