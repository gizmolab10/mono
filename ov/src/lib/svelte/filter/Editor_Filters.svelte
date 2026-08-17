<script lang='ts'>
	import { foot_is_all_folds, inverted, toggle_all_areas, w_areas_open, w_form_folded } from '../../ts/managers/Filters';
	import { ALL_TAGS, T_Kind, in_order, type File } from '../../ts/types/File';
	import { names_ride_in, placements_of } from '../../ts/utilities/Tag_Rows';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { file_path_of, save_file } from '../../ts/utilities/Saving';
	import { with_labels_replaced } from '../../ts/utilities/Labels';
	import { smooth_height } from '../../ts/utilities/Smooth_Height';
	import Action, { T_Position } from '../../ts/types/Action';
	import { T_Hit_Target } from '../../ts/types/Hit_Targets';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { T_Edge } from '../../ts/utilities/Sectioning';
	import { WAY_OUT } from '../../ts/events/Hit_Target';
	import { TAG_AREAS } from '../../ts/types/Tag_Areas';
	import Separator from '../support/Separator.svelte';
	import Big_Pill from '../support/Big_Pill.svelte';
	import { files } from '../../ts/managers/Files';
	import Section from '../support/Section.svelte';
	import { k } from '../../ts/common/Constants';
	import { debug } from '../../ts/common/Debug';
	import { hits } from '../../ts/events/Hits';
	import Stack from '../support/Stack.svelte';

	// What a guide is labeled: its title, its date, the line saying what it is for, its one kind,
	// and its tags. The labels are never on the page — they are taken off before the words are
	// drawn — so this is where they are read and changed. Nothing here is typed as free text
	// where it matters: the kind and the tags are picked from the only lists the app accepts.

	let {
		name, guide, tags, text = $bindable(''),
		folded = $bindable(false), onclose, onsay,
	}: {
		guide       : File;                 	// the record of the file being read
		name        : string;                	// what the file is called
		text        : string;                	// the whole file, which a write here changes
		folded      : boolean;               	// nothing stands open at the foot of this form, told outward so the words below draw no line of their own
		tags        : string[];              	// the tags it wears right now
		onclose     : () => void;            	// back to the list
		onsay       : (words: string) => void;  // something to tell the reader, briefly
	} = $props();

	let form_description = $state('');
	let form_title       = $state('');
	let form_kind        = $state('');
	let form_date        = $state('');
	let form_tags        = $state<string[]>([]);
	let tags_lit         = $state(false);   // the cursor is among the tag areas, so their own word lights
	const KINDS = Object.values(T_Kind);

	// Whether the form is on screen at all. Remembered across visits, since it is a way of
	// working rather than something about one guide.
	const w_show_filters = preferences.persistent<boolean>(T_Preference.show_filters, true);

	// Said outward, so whoever stacks this knows its own line would stand on the line above with
	// nothing between them. That is so with the whole form away, and equally with the kinds and
	// the tags both folded — the tags then stand flat and the kinds' line is the last thing.
	$effect(() => {
		folded = !$w_show_filters || foot_is_all_folds(!show_form_kinds, !show_form_tags);
	});

	// The way back to the list is two areas — these label rows and the two rows above the heavy
	// line — and they light as one. Both carry the one name, so whichever the manager has under
	// the cursor lights both.
	const w_s_hover = hits.w_s_hover;
	let way_out_lit = $derived(($w_s_hover?.id ?? '').includes(WAY_OUT));

	// The tag areas take four rows of their own, so the word above them folds them away — and
	// says what the guide wears while they are gone, as the filters' own lines do. Which rows are
	// folded is remembered between visits, named rather than numbered, the same as the list's.
	let show_form_tags = $derived(!$w_form_folded.includes('tags'));
	let form_tags_word = $derived(show_form_tags ? 'tags'
		: `tags ➜ ${form_tags.length === 0 ? 'none' : [...form_tags].sort(in_order).join(', ')}`);

	// The seven kinds take a row of their own, folded away the same way — and folded, the word
	// says which one the guide is, so a kind is never hidden without a sign of it.
	let show_form_kinds = $derived(!$w_form_folded.includes('kinds'));
	let form_kinds_word = $derived(show_form_kinds ? 'kinds'
		: `kinds ➜ ${form_kind === '' ? 'none' : form_kind}`);

	/** Fold one of the form's rows away, or bring it back. */
	function fold_form(name: string, away: boolean) {
		w_form_folded.update((names) => away ? [...names, name] : names.filter((one) => one !== name));
	}

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

	const picking_action = $derived(Object.assign(new Action(), { element: picking_control, position: T_Position.center }));
	const filters_action = $derived(Object.assign(new Action(), { element: filters_button, position: T_Position.left }));
	const kinds_action   = $derived(Object.assign(new Action(), { element: kinds_button,   position: T_Position.left }));
	const tags_action    = $derived(Object.assign(new Action(), { element: tags_button,    position: T_Position.left }));

	// Does a name ride above a pill in the topmost row of tags? Only then does the row hold a gap
	// above itself, so that name stands clear of the line overhead.
	let tags_row = $state<HTMLElement | null>(null);
	let names_riding = $state(false);


	function look_for_names() {
		names_riding = tags_row === null ? false : names_ride_in(placements_of(tags_row));
		// The run just changed shape, so every tag in it stands somewhere new. Asked at the next
		// drawing, since a run re-wrapping says this many times over.
		hits.recalibrate_when_drawn();
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
		fold_form('kinds', show_form_kinds);
		debug.log(`Editing "${name}": the kinds row is now ${show_form_kinds ? 'folded away' : 'shown'}.`);
	}

	/** Put the tag areas away, or bring them back. */
	function toggle_tags() {
		fold_form('tags', show_form_tags);
		debug.log(`Editing "${name}": the tag areas are now ${show_form_tags ? 'folded away' : 'shown'}.`);
	}

	// Whenever another guide comes on screen, the form starts from what that guide says.
	$effect(() => {
		form_description = guide.description;
		form_title       = guide.title;
		form_kind        = guide.kind;
		form_date        = guide.date;
		form_tags        = [...tags];
	});


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
		save_file(where, whole, was).then((answer) => {
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
				files.relabel(guide, filters, form_tags);
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
	<button type='button' class='fold-word' class:forced={way_out_lit} bind:this={filters_button}
		use:hit_target={{ id: 'editor.fold.filters', onpress: toggle_filters }}>{filter_rows_word}</button>
	<button type='button' class='fold-word' class:forced={way_out_lit} bind:this={kinds_button}
		use:hit_target={{ id: 'editor.fold.kinds', onpress: toggle_kinds }}>{form_kinds_word}</button>
	<button type='button' class='fold-word' class:forced={tags_lit || way_out_lit} bind:this={tags_button}
		use:hit_target={{ id: 'editor.fold.tags', onpress: toggle_tags }}>{form_tags_word}</button>
	<!-- Two presses. Neither is a state — a guide wears the tags it wears — so neither ever reads
	     as picked; they answer under the cursor only. -->
	<span class='picking' bind:this={picking_control}>
		<button class='segment press'
			use:hit_target={{ id: 'editor.picking.clear', onpress: clear_tags,
				tip: 'take every tag off this guide' }}>clear</button>
		<button class='segment press'
			use:hit_target={{ id: 'editor.picking.invert', onpress: invert_tags,
				tip: 'give it exactly the tags it does not wear' }}>invert</button>
	</span>
</div>

<!-- What a guide says about itself in words: its title, its date, and one line saying what it is
     for. They sit closer together than sections do, since they are rows of one thing rather than
     things of their own.

     The bare space among them is another way back to the list, the same as the two rows above the
     heavy line — and the two light together, since they are one way out. Each field is a control
     the manager knows about, so the way out standing behind them never answers for the space one
     of them occupies. -->
{#snippet word_rows()}
	<div class='label-rows first' role='button' tabindex='-1' onkeyup={() => {}}
		class:lit={way_out_lit}
		use:hit_target={{ id: `${WAY_OUT}.labels`, type: T_Hit_Target.section,
			onpress: onclose, tip: 'resume browse' }}>
		<div class='word-rows'>
			<div class='filter-row'>
				<span class='filter-word'>title</span>
				<input class='filter-field' bind:value={form_title} onblur={save_filters}
					use:hit_target={{ id: 'editor.field.title', tip: 'what this guide is called' }} />
				<span class='filter-word'>date</span>
				<input class='filter-field date' bind:value={form_date} onblur={save_filters}
					use:hit_target={{ id: 'editor.field.date', tip: 'when it was last worked on' }} />
			</div>
			<div class='filter-row'>
				<span class='filter-word'>brief</span>
				<input class='filter-field' bind:value={form_description} onblur={save_filters}
					use:hit_target={{ id: 'editor.field.brief', tip: 'one sentence saying what it is for' }} />
			</div>
		</div>
	</div>
{/snippet}

<!-- The kinds. No word beside them: the separator above already says what they are. Their own bare
     space carries the way out's name and press, so it lights and acts with the rows above it. -->
{#snippet kinds_picker()}
	<div class='label-rows kinds-rows' role='button' tabindex='-1' onkeyup={() => {}}
		class:lit={way_out_lit}
		use:hit_target={{ id: `${WAY_OUT}.kinds`, type: T_Hit_Target.section,
			onpress: onclose, tip: 'resume browse' }}>
		<div class='filter-row wrapping'>
			{#each KINDS as one (one)}
				<!-- A guide wears one kind, so pressing the one it wears takes it off and pressing
				     any other puts that one on in its place. -->
				<button class='filter-pick' class:on={form_kind === one}
					use:hit_target={{ id: `editor.kind.${one}`,
						tip: `${form_kind === one ? 'remove' : 'add'} "${one}" kind`,
						onpress: () => { form_kind = form_kind === one ? '' : one; save_filters(); } }}>{one}</button>
			{/each}
		</div>
	</div>
{/snippet}

<!-- The same areas the filters use. Every tag is within reach here, since this is where a file's
     own tags are set rather than where files are narrowed. A press on the bare space among them
     shuts them all; a press on an area itself is that area's own.

     Each area is wrapped so it can be slid: opening one grows it from a word to a run of segments,
     and the pills after it move a long way at once. -->
{#snippet tags_picker()}
	<div class='bare-answers' role='presentation'
		use:hit_target={{ id: 'editor.tags', type: T_Hit_Target.section,
			onrelease: () => toggle_all_areas(TAG_AREAS.map((one) => one.name)),
			tip: $w_areas_open.length === 0 ? 'expand tagsets' : 'collapse tagsets' }}
		onmouseenter={() => { tags_lit = true; }}
		onmouseleave={() => { tags_lit = false; }}
		onkeyup={() => {}}>
		<div class='filter-row wrapping tags-row' class:named={names_riding}
			bind:this={tags_row} use:smooth_height>
			{#each TAG_AREAS as area (area.name)}
				<span class='pill-slot'>
					<Big_Pill row='editor' {area} in_reach={ALL_TAGS} chosen={form_tags} ontoggle={toggle_tag} />
				</span>
			{/each}
		</div>
	</div>
{/snippet}

<!-- Folded, this whole block is bare space above the file's words, so it is another way back to
     the list. Open, the form fills it and only the label rows inside are. -->
<div class='filter-block' class:lit={way_out_lit && !$w_show_filters}
	role='button' tabindex='-1' onkeyup={() => {}}
	use:hit_target={{ id: `${WAY_OUT}.block`, type: T_Hit_Target.section,
		dormant: $w_show_filters, onpress: onclose, tip: 'resume browse' }}>
<!-- What the guide is labeled, as a section of its own: its line carries the word that folds
     the whole form away, and holds three subsections — the words, the kinds, the tags.

     It asks for no gap at all, which is how a section says it should stand flat when folded: the
     words below come straight up under its line, and the line that would have stood under it is
     left undrawn. Its own children hold the gap while it is open, so the number is unused then. -->
<Section
	gap={0}
	holds_subsections
	id='editor.filters'
	edge={T_Edge.thick}
	folded={!$w_show_filters}
	actions={[filters_action]}>
	{#snippet contents()}
	<!-- The form is one stack of three subsections: what the guide says about itself in words, its
	     one kind, and its tags. The heavy line carrying the word that folds the whole form away is
	     drawn by the section holding us, so we say how thick it is and the stack measures from its
	     middle like every other separator. -->
	<Stack gap={k.gap.big} thickness={k.thickness.normal} sections={[
		{ subsection: word_rows },
		{ subsection: kinds_picker, rides: [kinds_action], folded: !show_form_kinds },
		{ subsection: tags_picker,  rides: [tags_action, picking_action], folded: !show_form_tags },
	]} />
	<!-- What closes the form off from the file's words below. Folded, the tags end against the
	     stack's own closing line and there is nothing more to draw here. -->
	{#if show_form_tags}
		<div class='foot'>
			<Separator thickness={k.thickness.huge} />
		</div>
	{/if}
	{/snippet}
</Section>
</div>

<style>
	/* Where the three fold words are written before their lines take them. Each is taken out of
	   here on the very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* The line closing the form off at the foot, pulled up half its own thickness. Every distance in
	   a stack is measured middle to middle, and the stack leaves its bottom edge exactly where this
	   line's middle belongs — but a line drawn below it starts there instead. */
	.foot {
		margin-top : calc(var(--thick-huge) / -2);
		flex       : 0 0 auto;
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
	.fold-word:global([data-hit]) {
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

	/* A part of the form that is a way back to the list. It reaches out to the box's left and right
	   edges and holds that width back as its own step-in, so what it shows stands exactly where it
	   did and the lit color covers the gap the box holds around its contents. */
	.label-rows {
		margin         : calc(var(--over) * -1) calc(var(--gap) * -1) calc(var(--under) * -1);
		padding        : var(--over) var(--gap) var(--under);
		flex-direction : column;
		cursor         : pointer;
		display        : flex;
		gap            : 0;
	}

	/* The first section stands under the heavy line the section holding us draws, and holds its own
	   small gap below it — the stack measures from that line's middle but holds nothing above its
	   own first section. The last one holds the same below its content. */
	.label-rows.first {
		padding-top : var(--gap-small);
	}

	/* The bare space among the tag pills answers its own press, and reaches out the same way. */
	.bare-answers {
		margin  : calc(var(--over) * -1) calc(var(--gap) * -1) calc(var(--under) * -1);
		padding : var(--over) var(--gap) calc(var(--under) + var(--gap-small));
	}

	.bare-answers:global([data-hit]) {
		background : var(--hover);
		cursor     : pointer;
	}

	/* Rows of one thing, so they sit closer together than sections do. */
	.word-rows {
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

	/* Neither is a state, so each takes the fill only under the cursor. The stronger fill it wore
	   while held is gone: the manager says pressed and released and nothing between, so nothing
	   knows when a button is being held down. */
	.picking .segment.press:global([data-hit]) {
		background : var(--hover);
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

	.filter-pick:not(.on):global([data-hit]) {
		background : var(--hover);
	}

	.filter-pick.on {
		background : var(--accent);
	}
</style>
