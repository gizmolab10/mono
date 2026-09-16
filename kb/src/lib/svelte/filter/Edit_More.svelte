<script lang='ts'>
	import { foot_is_all_folds, inverted, toggle_all_areas, w_areas_open, w_form_folded, w_search_text } from '../../ts/managers/Filters';
	import { in_order, type File } from '../../ts/types/File';
	import { customizations } from '../../ts/common/Customizations';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { file_path_of } from '../../ts/utilities/Saving';
	import { Action, T_Position } from '../../ts/common/Core';
	import { T_Hit_Target } from '../../ts/common/Core';
	import { hit_target } from '../../ts/common/Core';
	import { T_Edge } from '../../ts/common/Core';
	import { WAY_OUT } from '../../ts/common/Core';
	import { Separator } from '../../ts/common/Core';
	import { files } from '../../ts/managers/Files';
	import { Section } from '../../ts/common/Core';
	import { k } from '../../ts/common/Core';
	import { debug } from '../../ts/common/Core';
	import { hits } from '../../ts/common/Core';
	import { Stack } from '../../ts/common/Core';
	import Kinds_Row from './Kinds_Row.svelte';
	import Tag_Rows from './Tag_Rows.svelte';
	import type { Snippet } from 'svelte';

	// The label form: what a guide is labeled, one stack above its words. The labels are never on
	// the page — they are taken off before the words are drawn — so this is where they are read
	// and changed. kb's own here are the kind and the tags, picked from the only lists the app
	// accepts. The information rows are the host's since step 10 of the plan, handed in as the
	// edit filter section and drawn above the kinds row; the search row is the host's since step
	// 13, rendered first, its line, gap and fold word this stack's.

	let {
		name, guide, tags, text = $bindable(''),
		folded = $bindable(false), onclose, onshow, edit_filter, search_row,
	}: {
		edit_filter? : Snippet<[File, string, (words: string) => void]>;   // the host's own rows, given the file, its words and a call that sets them, above the kinds row
		search_row?  : Snippet<[string]>;    	// the host's search row, given the file's name, first in the stack
		guide       : File;                 	// the record of the file being read
		name        : string;                	// what the file is called
		text        : string;                	// the whole file, which a write here changes
		folded      : boolean;               	// nothing stands open at the foot of this form, told outward so the words below draw no line of their own
		tags        : string[];              	// the tags it wears right now
		onclose     : () => void;            	// back to the list
		onshow       : (message: string) => void;  // something to tell the reader, briefly
	} = $props();

	let form_kind        = $state('');
	let form_tags        = $state<string[]>([]);
	let tags_lit         = $state(false);   // the cursor is among the tag areas, so their own word lights

	// Whether the form is on screen at all. Remembered across visits, since it is a way of
	// working rather than something about one guide.
	const w_show_filters = preferences.persistent<boolean>(T_Preference.show_filters, true);

	// Whether the search row inside the form is shown. Read here as well as inside the row, since
	// the stack has to leave the folded space for it — one remembered value, two readers.
	const w_show_search = preferences.persistent<boolean>(T_Preference.show_search, true);

	// Said outward, so whoever stacks this knows its own line would stand on the line above with
	// nothing between them. That is so with the whole form away, and equally with the kinds and
	// the tags both folded — the tags then stand flat and the kinds' line is the last thing.
	$effect(() => {
		folded = !$w_show_filters || foot_is_all_folds(!show_form_kinds, !show_form_tags);
	});

	// Folded, the whole block is a way back to the list, and the clickables' edges show while the
	// cursor is on it. Open, no row's bare space goes back: the way back is the top row's button.
	const w_s_hover = hits.w_s_hover;
	let way_out_lit = $derived(($w_s_hover?.id ?? '').includes(WAY_OUT));

	// The tag areas take four rows of their own, so the clickable above them folds them away — and
	// says what the guide wears while they are gone, as the filters' own lines do. Which rows are
	// folded is remembered between visits, named rather than numbered, the same as the list's.
	let show_form_tags = $derived(!$w_form_folded.includes('tags'));
	let form_tags_word = $derived(show_form_tags ? 'tags'
		: `tags ➜ ${form_tags.length === 0 ? 'none' : [...form_tags].sort(in_order).join(', ')}`);

	// The seven kinds take a row of their own, folded away the same way — and folded, the word
	// says which one the guide is, so a kind is never hidden without a sign of it.
	// Shown, the word is just "search". Folded with something typed, it says what is being looked
	// for, so a search left running is never invisible. The row itself is folded away by this, so
	// the word cannot be built inside it — a fold would take the word with the row and nothing
	// would be left to press.
	let search_word = $derived($w_show_search || $w_search_text === '' ? 'search' : `search ➜ ${$w_search_text}`);

	/** Put the search row away, or bring it back. */
	function toggle_search() {
		w_show_search.set(!$w_show_search);
		debug.log(`Editing "${name}": the search row is now ${!$w_show_search ? 'folded away' : 'shown'}.`);
	}

	// The host's rows, ai's information rows, fold away like the others. The clickable says only
	// its name, open or folded — the title is already the biggest thing on the screen, so
	// repeating it here said nothing.
	let show_form_info = $derived(!$w_form_folded.includes('info'));
	let form_info_word = 'information';

	let show_form_kinds = $derived(!$w_form_folded.includes('kinds'));
	let form_kinds_word = $derived(show_form_kinds ? 'kinds'
		: `kinds ➜ ${form_kind === '' ? 'none' : form_kind}`);

	/** Fold one of the form's rows away, or bring it back. */
	function fold_form(name: string, away: boolean) {
		w_form_folded.update((names) => away ? [...names, name] : names.filter((one) => one !== name));
	}

	// The word on the line above the form folds the whole form away. With the form on screen it
	// reads 'less'; folded, it reads 'more' and says what the file is labeled, since that is the
	// only place left to read it.
	let filter_rows_word = $derived($w_show_filters ? 'less'
		: `more ➜ ${[form_kind, ...[...form_tags].sort(in_order)]
			.filter((one) => one !== '').join(', ') || 'none'}`);

	// The three clickables that fold these sections away are ours, not the lines'. Each is built as a
	// button below, out of sight; the browser makes it one drawing after we ask, so each of these
	// holds nothing on the first drawing and the made button on the next — which is itself a
	// change, so the line it stands on is told at once.
	let filters_button   = $state<HTMLElement | null>(null);
	let search_button    = $state<HTMLElement | null>(null);
	let search_clear     = $state<HTMLElement | null>(null);
	let kinds_button     = $state<HTMLElement | null>(null);
	let kinds_clear      = $state<HTMLElement | null>(null);
	let info_button      = $state<HTMLElement | null>(null);

	// Whatever the host's rows mark with the class rides-the-line, ai's title tools, is put on
	// the host subsection's line, centered, the way the information rows' own tools rode it while
	// they were kb's. Looked for once the rows are drawn, and only while the form shows: folded,
	// it would act on hidden fields.
	let host_box   = $state<HTMLElement | null>(null);
	let host_tools = $state<HTMLElement | null>(null);
	$effect(() => {
		const box = host_box;
		if (!box) { return; }
		requestAnimationFrame(() => {
			host_tools = box.querySelector('.rides-the-line');
			// Said once the line has taken them: how tall the browser drew the host's tools and the
			// information clickable beside them, which are meant to be the same.
			requestAnimationFrame(() => requestAnimationFrame(() => {
				const tool = host_tools?.firstElementChild?.getBoundingClientRect().height ?? 0;
				const word = info_button?.getBoundingClientRect().height ?? 0;
				debug.log(`Editing "${name}": the host's tools stand ${tool.toFixed(2)} tall on the line, the information clickable ${word.toFixed(2)}.`);
			}));
		});
	});
	let tags_button      = $state<HTMLElement | null>(null);

	// The two presses that change which tags the guide wears. They stand on the tags line at the
	// middle, beside the word that folds the areas rather than inside what that word folds away.
	let picking_control = $state<HTMLElement | null>(null);

	const picking_action     = $derived(Object.assign(new Action(), { element: picking_control, position: T_Position.center }));
	const search_clearer     = $derived(Object.assign(new Action(), { element: search_clear,    position: T_Position.center }));
	const kinds_clearer      = $derived(Object.assign(new Action(), { element: kinds_clear,     position: T_Position.center }));
	const filters_action     = $derived(Object.assign(new Action(), { element: filters_button,  position: T_Position.left }));
	const search_action      = $derived(Object.assign(new Action(), { element: search_button,   position: T_Position.left, inset: 'calc(var(--gap-fat) + var(--gap-big))' }));
	const info_action        = $derived(Object.assign(new Action(), { element: info_button,     position: T_Position.left, inset: 'calc(var(--gap-fat) + var(--gap-big))' }));
	const host_tools_action  = $derived(Object.assign(new Action(), { element: $w_show_filters ? host_tools : null, position: T_Position.center, transparent: true }));
	const kinds_action       = $derived(Object.assign(new Action(), { element: kinds_button,    position: T_Position.left, inset: 'calc(var(--gap-fat) + var(--gap-big))' }));
	const tags_action        = $derived(Object.assign(new Action(), { element: tags_button,     position: T_Position.left, inset: 'calc(var(--gap-fat) + var(--gap-big))' }));

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

	/** Put the host's rows away, or bring them back. */
	function toggle_info() {
		fold_form('info', show_form_info);
		debug.log(`Editing "${name}": the host's rows are now ${show_form_info ? 'folded away' : 'shown'}.`);
	}

	/** Put the tag areas away, or bring them back. */
	function toggle_tags() {
		fold_form('tags', show_form_tags);
		debug.log(`Editing "${name}": the tag areas are now ${show_form_tags ? 'folded away' : 'shown'}.`);
	}

	// Whenever another guide comes on screen, the form starts from what that guide wears.
	$effect(() => {
		form_kind = guide.kind;
		form_tags = [...tags];
	});


	/**
	 * Write the kind and the tags to the db as labels, if either changed. Nothing is written to
	 * the file. The four fields and the sources are the host's rows' to write. A refusal leaves
	 * the record as it was, and is said along the bottom.
	 */
	async function save_filters() {
		const worn = files.hierarchy.tag_names_of(guide.id);
		const same_tags = worn.length === form_tags.length && worn.every((tag) => form_tags.includes(tag));
		if (guide.labeled && guide.kind === form_kind && same_tags) { return; }
		const where = file_path_of(guide.bundle, guide.path);
		debug.log(`Editing "${name}": the kind or the tags changed — writing them to the db for ${where}.`);
		const in_db = await files.write_labels(guide, form_kind, form_tags);
		if (!in_db.ok) {
			onshow(`not saved — ${in_db.why}`);
			debug.log(`Editing "${name}": the kind and tags were NOT written to the db — ${in_db.why}.`);
			return;
		}
		// The list shows the tags, so it is told at once rather than waiting for every file to be
		// read again, the four fields as the record has them. A fault here would leave the db
		// written and the app still holding the old labels, so it is said out loud.
		const labels = { kind: form_kind, title: guide.title, description: guide.description, use_when: guide.use_when ?? [], date: guide.date, labeled: true };
		try {
			files.relabel(guide, labels, form_tags);
		} catch (trouble) {
			onshow('written, but the list was not told');
			debug.log(`Editing "${name}": the db was written, but telling the list failed — ${String(trouble)}. The app still holds the old labels.`);
			return;
		}
		debug.log(`Editing "${name}": labels written — kind "${form_kind}", ${form_tags.length} tag(s).`);
	}

	/** Put a tag on this guide or take it off, and write it. The same ladder as the list's
	 * filters: option keeps only this tag within its own tagset, command-option everywhere. */
	function toggle_tag(tag: string, only: boolean = false, among: string[] = [], everywhere: boolean = false) {
		if (everywhere)  { form_tags = [tag]; }
		else if (only)   { form_tags = [...form_tags.filter((t) => t !== tag && !among.includes(t)), tag].sort(in_order); }
		else             { form_tags = form_tags.includes(tag) ? form_tags.filter((t) => t !== tag) : [...form_tags, tag].sort(in_order); }
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
		form_tags = inverted(customizations.tags, form_tags).sort(in_order);
		debug.log(`Editing "${name}": the tags turned over — it now wears ${form_tags.length} of the ${customizations.tags.length}.`);
		save_filters();
	}
</script>

<!-- Folded, the section's own empty area is a way back to the list: bare space above the file's
     contents. Open, the rows inside answer for themselves, and their bare space answers nothing. -->
<!-- The four clickables that fold these sections away, built here rather than by the lines they stand
     on. Each is written out of sight, since the moment the browser has made it, it is taken and
     put on its line instead. -->
<div class='out_of_sight'>
	<button type='button' class='clickable' class:forced={way_out_lit} bind:this={filters_button}
		use:hit_target={{ id: 'editor.fold.filters', onpress: toggle_filters }}>{filter_rows_word}</button>
	<button type='button' class='clickable' class:forced={way_out_lit} bind:this={search_button}
		use:hit_target={{ id: 'editor.fold.search', onpress: toggle_search, tip: 'search this file' }}>{search_word}</button>
	<!-- Drawn only with something to clear: an empty field offers nothing to press for.
	     Clearing also puts the highlighted words back. -->
	{#if $w_search_text !== ''}
		<button class='clear' bind:this={search_clear}
			use:hit_target={{ id: 'editor.clear.search', onpress: () => w_search_text.set(''),
				tip: 'empty the search field' }}>clear</button>
	{/if}
	<button type='button' class='clickable' class:forced={way_out_lit} bind:this={info_button}
		use:hit_target={{ id: 'editor.fold.info', onpress: toggle_info }}>{form_info_word}</button>
	<button type='button' class='clickable' class:forced={way_out_lit} bind:this={kinds_button}
		use:hit_target={{ id: 'editor.fold.kinds', onpress: toggle_kinds }}>{form_kinds_word}</button>
	<!-- Drawn only while the guide wears a kind: with none, there is nothing to take off. -->
	{#if form_kind !== ''}
		<button class='clear' bind:this={kinds_clear}
			use:hit_target={{ id: 'editor.clear.kinds', onpress: () => { form_kind = ''; save_filters(); },
				tip: 'take the kind off this guide' }}>clear</button>
	{/if}
	<button type='button' class='clickable' class:forced={tags_lit || way_out_lit} bind:this={tags_button}
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

<!-- Looking through the file on screen, the host's search row, given the file's name. Its line,
     its gap and the place its word stands are this stack's, exactly as they are for the kinds and
     the tags. -->
{#snippet search_rows()}
	<div class='label-rows search-rows'>
		{@render search_row?.(name)}
	</div>
{/snippet}


<!-- The host's own rows, given the file, its words and a call that sets them, rendered only where
     the host hands them: ai's information rows, above the kinds row. -->
{#snippet host_rows()}
	<div class='label-rows information' bind:this={host_box}>
		{@render edit_filter?.(guide, text, (words) => { text = words; })}
	</div>
{/snippet}

<!-- The kinds row, kb's own component: the form keeps the kind and writes it. -->
{#snippet kinds_picker()}
	<Kinds_Row kind={form_kind} onpick={(kind) => { form_kind = kind; save_filters(); }} />
{/snippet}

<!-- The tag rows, kb's own component: the form keeps the tags and writes them, and lights their
     word while the cursor is among them. -->
{#snippet tags_picker()}
	<Tag_Rows tags={form_tags} ontoggle={toggle_tag} onhover={(over) => { tags_lit = over; }} />
{/snippet}

<!-- Folded, this whole block is bare space above the file's contents, so it is another way back to
     the list. Open, the form fills it and only the label rows inside are. -->
<div class='filter-block' class:lit={way_out_lit && !$w_show_filters}
	role='button' tabindex='-1' onkeyup={() => {}}
	use:hit_target={{ id: `${WAY_OUT}.block`, type: T_Hit_Target.section,
		dormant: $w_show_filters, onpress: onclose, tip: 'resume browse' }}>
	<!-- What the guide is labeled, as a section of its own: its line carries the word that folds
		the whole form away, and holds four subsections — the search, the host's rows, the kinds row, the tag rows.

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
			<!-- The form is one stack of four subsections: looking through the file, the host's rows, its one kind,
				and its tags. The heavy line carrying the clickable that folds the whole form away
				is drawn by the section holding us, so we say how thick it is and the stack measures from
				its middle like every other separator. -->
			<Stack gap={k.gap.big} thickness={k.thickness.normal} over={k.thickness.huge} foot='below' leads={[search_action, search_clearer]} sections={[
				// The search is first, so its clickable and its clear ride the stack's own leading line.
				// None of these three answers the cursor on its bare space. The row is the host's, so it
				// is stacked only where the host hands one.
				...(search_row ? [{ subsection: search_rows, folded: !$w_show_search }] : []),
				// The host's own rows, above the kinds row, only where the host hands them, folding under
				// the information clickable as the information rows did while they were kb's.
				...(edit_filter ? [{ subsection: host_rows, rides: [info_action, host_tools_action], folded: !show_form_info }] : []),
				{ subsection: kinds_picker, rides: [kinds_action, kinds_clearer], folded: !show_form_kinds },
				// A press on the bare space among the tagsets shuts them all. The slot answers, not the row.
				{ subsection: tags_picker,  rides: [tags_action, picking_action], folded: !show_form_tags,
					answers: { id: 'editor.tags', type: T_Hit_Target.section,
						onrelease: () => toggle_all_areas(customizations.tag_areas.map((one) => one.name)),
						tip: $w_areas_open.length === 0 ? 'expand tagsets' : 'collapse tagsets' } },
			]} />
			<!-- What closes the form off from the file's contents below. Always drawn, whatever is
			     folded — the stack is told so, and leaves its last fold this line to end against
			     rather than drawing one of its own. -->
			<div class='foot'>
				<Separator thickness={k.thickness.huge} />
			</div>
		{/snippet}
	</Section>
</div>

<style>
	/* Where the four clickables are written before their lines take them. Each is taken out of
	   here on the very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* The line closing the form off at the foot, pulled up half its own thickness. Every distance in
	   a stack is measured middle to middle, and the stack leaves its bottom edge exactly where this
	   line's middle belongs — but a line drawn below it starts there instead. */
	.foot {
		margin-top : calc(var(--thick-huge) / -1);
		flex       : 0 0 auto;
	}

	/* A word that folds its section away, standing on the line above it. Its white
	   background masks the line behind it. The edge is held see-through and counted inside the
	   word's own space, so the hover edge adds no width and the word never shifts. */
	.clickable {
		background    : var(--white);
		border        : var(--thick-faint) solid var(--black);
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
	.clickable:global([data-hit]) {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

	.clickable.forced {
		border-color : var(--darkgray);
		background   : var(--white);
	}

	/* Folded, this whole block is bare space above the file's contents, so it is a way back to the
	   list and lights with the two rows above it. It reaches out to the box's left and right
	   edges, the way those rows do, so the lit color covers the gap the box holds around its
	   contents rather than stopping short. */
	/* Pulled up by the region's own top padding, so the form's heavy line sits exactly on the
	   region's top edge and the clickable riding it pokes above the border. */
	.filter-block {
		margin         : calc(var(--gap) * -1) calc(var(--gap) * -1) 0;
		padding        : 0 var(--gap);
		flex-direction : column;
		display        : flex;
	}

	.filter-block.lit {
		background : var(--hover);
		cursor     : pointer;
	}

	/* A row of the form. One gap below what it shows; its bare space answers nothing. */
	.label-rows {
		padding-bottom : var(--gap);
		flex-direction : column;
		display        : flex;
		gap            : 0;
	}

	/* The search field sits a faint gap above the middle of its slot: a faint gap above, a tiny gap
	   plus a faint one below. Together they are the one gap every label row holds below, so the
	   section is no taller. */
	.label-rows.search-rows {
		padding-top    : var(--gap-faint);
		padding-bottom : calc(var(--gap-tiny) + var(--gap-faint));
	}

	/* The host's rows hold a small gap below, less than the other label rows. */
	.label-rows.information {
		padding-bottom : var(--gap-small);
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


	/* The clear on the search line, matching the list's. */
	.clear {
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		background    : var(--white);
		padding       : 0 var(--gap);
		color         : var(--text);
		box-sizing    : border-box;
		align-self    : center;
		cursor        : pointer;
		white-space   : nowrap;
		flex-shrink   : 0;
	}

	.clear:global([data-hit]) {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

</style>
