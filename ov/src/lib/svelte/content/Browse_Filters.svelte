<script lang='ts'>
	import { w_project, w_kind, w_show_filters, w_filters_folded, w_tags, w_tag_picking, w_words } from '../../ts/managers/Filters';
	import { foot_is_all_folds, inverted, T_Picking } from '../../ts/managers/Filters';
	import { toggle_all_areas, UNLABELED, w_areas_open } from '../../ts/managers/Filters';
	import { T_Bundle, T_Kind } from '../../ts/types/File';
	import Action, { T_Position } from '../../ts/types/Action';
	import { TAG_AREAS, tags_shown } from '../../ts/types/Tag_Areas';
	import { fade } from 'svelte/transition';
	import { names_ride_in, places_of } from '../../ts/utilities/Tag_Rows';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { hits } from '../../ts/events/Hits';
	import { smooth_height } from '../../ts/utilities/Smooth_Height';
	import Section from '../support/Section.svelte';
	import { T_Edge } from '../../ts/utilities/Sectioning';
	import Big_Pill from '../support/Big_Pill.svelte';
	import { guides } from '../../ts/managers/Files';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	function toggle_filters() {
		const next = !$w_show_filters;
		w_show_filters.set(next);
		debug.log(`Filters are now ${next ? 'shown' : 'hidden'} — the project, kind and tag rows ${next ? 'came back' : 'went away'}; the search field stays either way.`);
	}

	// The three filters, across the top of the content box: one kind at a time, any
	// number of tags, and words to look for. They are kept with the rest of the filters,
	// where the hierarchy can read them; this only shows them.

	// TWO WAYS TO SHOW A WORD THAT WOULD LEAVE NOTHING. Change this one letter and reload.
	//
	//   'a' — every word always shows; the ones with nothing behind them read gray and are
	//         dead to the touch. The rows never change shape.
	//   'b' — only words with something behind them show at all. Nothing is ever dead, but
	//         the rows shrink and grow as the filters move.
	const test: string = 'b';

	// The files are read at launch, so what kinds and tags exist isn't known until that
	// finishes. Both lists fill themselves in the moment it does.
	// What each row offers is worked out against every other filter — no row judges itself,
	// so picking a kind never grays out the other kinds. Every filter is named below so the
	// rows are worked out again whenever any of them moves.
	const w_ready = guides.w_ready;
	let kinds = $derived.by(() => { $w_project; $w_tags; $w_words; return $w_ready ? guides.kinds_present() : []; });
	let bare = $derived.by(() => { $w_project; $w_tags; $w_words; return $w_ready ? guides.unlabeled_within_reach() : 0; });
	// The tags row names the picked tags and which way they pick, unlike the other two rows: with
	// every picked tag required, it cannot set its own filter aside, so what it offers changes as
	// the picks do.
	let tags_in_use = $derived.by(() => { $w_project; $w_kind; $w_words; $w_tags; $w_tag_picking; return $w_ready ? guides.tags_present() : []; });
	const projects = Object.values(T_Bundle);
	let counts = $derived.by(() => {
		$w_kind; $w_tags; $w_words;
		return $w_ready ? new Map(projects.map((p) => [p, guides.files_in(p)])) : new Map();
	});

	// What each row actually draws: everything on the closed lists one way, only what is
	// within reach the other. A word already picked always shows, so a choice never vanishes
	// from under the cursor.
	let shown_kinds = $derived(test === 'a' ? Object.values(T_Kind)
		: Object.values(T_Kind).filter((kind) => kinds.includes(kind) || $w_kind === kind));
	let shown_projects = $derived(test === 'a' ? projects
		: projects.filter((p) => (counts.get(p) ?? 0) > 0 || $w_project === p));

	// How many words the kinds row actually offers — the kinds themselves, and the one that asks
	// for the files carrying no labels, which is only there while there are some.
	let kinds_offered = $derived(shown_kinds.length + (bare > 0 || $w_kind === UNLABELED ? 1 : 0));

	function choose_project(project: string) {
		w_project.set($w_project === project ? '' : project);
	}

	function choose_kind(kind: string) {
		w_kind.set($w_kind === kind ? '' : kind);
	}

	function toggle_tag(tag: string) {
		w_tags.update((chosen) => chosen.includes(tag)
			? chosen.filter((t) => t !== tag)
			: [...chosen, tag]);
	}

	function clear_tags() {
		w_tags.set([]);
		debug.log('Filters: every picked tag dropped.');
	}

	// What inverting works over: the tags the row actually offers — those still within reach,
	// and those already picked, which always show so a choice never vanishes under the cursor.
	function invert_tags() {
		const offered = [...new Set([...tags_in_use, ...$w_tags])];
		const now = inverted(offered, $w_tags);
		w_tags.set(now);
		debug.log(`Filters: the tags turned over — ${$w_tags.length} of the ${offered.length} on offer were picked, ${now.length} are now.`);
	}

	function pick_way(way: T_Picking) {
		w_tag_picking.set(way);
		debug.log(`Filters: a file now shows if it wears ${way} the ${$w_tags.length} picked tag(s).`);
	}

	// Each row can be folded away by pressing the word above it. Folded, that word says how to
	// get the row back and what is picked, so nothing is hidden without a way out. With either
	// of the top two folded they take separate bars, since one word over two halves would
	// point at the wrong place. Which rows are folded is remembered between visits, named
	// rather than numbered so adding a row later cannot shift the meaning of what was saved.
	let show_projects = $derived(!$w_filters_folded.includes('projects'));
	let show_kinds = $derived(!$w_filters_folded.includes('kinds'));
	let show_tags = $derived(!$w_filters_folded.includes('tags'));

	let project_word = $derived($w_project === '' ? 'all' : $w_project);
	let kind_word = $derived($w_kind === '' ? 'all' : $w_kind);
	let tags_word = $derived($w_tags.length === 0 ? 'all' : $w_tags.join(', '));

	// How long an area that runs out of tags takes to fade away, in milliseconds. Said in one
	// place for the whole app, so everything that arrives or leaves does it at the same rate.
	const FADE = k.timeout.fade;

	// Only the areas with something left to show. Worked out here rather than inside each pill,
	// because an area that draws nothing must not leave a wrapper behind holding a gap open.
	let showing_areas = $derived(TAG_AREAS.filter((area) => tags_shown(area, tags_in_use, $w_tags).length !== 0));

	// Does a name ride above a pill in the topmost row of tags? Only then does the row hold a gap
	// above itself, so that name stands clear of the line overhead.
	let tags_row = $state<HTMLElement | null>(null);
	let names_riding = $state(false);


	function look_for_names() {
		names_riding = tags_row === null ? false : names_ride_in(places_of(tags_row));
		// The run just changed shape, so every tag in it stands somewhere new.
		hits.recalibrate();
	}

	// Measured again whenever the pills change, and again whenever the run changes shape — it
	// wraps differently at a different width, and a pill opening slides its neighbors onto
	// another line partway through.
	$effect(() => {
		showing_areas; $w_areas_open; $w_tags; tags_in_use;
		look_for_names();
		const row = tags_row;
		if (!row) { return; }
		const watcher = new ResizeObserver(look_for_names);
		watcher.observe(row);
		for (const pill of [...row.children]) { watcher.observe(pill); }
		return () => watcher.disconnect();
	});

	// What the word on the bar says: just the name while the row is there, the name and what
	// is picked while it is folded away.
	function heading(name: string, shown: boolean, picked: string): string {
		return shown ? name : `${name} ➜ ${picked}`;
	}

	function fold(name: string, away: boolean) {
		w_filters_folded.update((names) => away ? [...names, name] : names.filter((one) => one !== name));
		debug.log(`Filters: the ${name} row is now ${away ? 'folded away' : 'shown'}.`);
	}

	// One word above them all, saying what every picking row holds — in the order they appear,
	// and leaving out any row narrowing nothing, since "all" says nothing worth the room.
	// Pressing it folds the whole set away or brings it back.
	let all_picked = $derived([project_word, kind_word, tags_word]
		.filter((one) => one !== 'all').join(', '));
	let all_word = $derived($w_show_filters ? '✂ filters'
		: `✂ filters ➜ ${all_picked === '' ? 'all' : all_picked}`);

	// The four words that fold these sections away are ours, not the lines'. Each is built as a
	// button below, out of sight; the browser makes it one drawing after we ask, so each of these
	// holds nothing on the first drawing and the made button on the next — which is itself a
	// change, so the line it stands on is told at once.
	let all_button      = $state<HTMLElement | null>(null);
	let projects_button = $state<HTMLElement | null>(null);
	let kinds_button    = $state<HTMLElement | null>(null);
	let tags_button     = $state<HTMLElement | null>(null);

	// How the picked tags narrow, and the two presses that change which are picked. It stands on
	// the tags line at the middle, so it is beside the word that folds them rather than inside
	// what that word folds away.
	let picking_control = $state<HTMLElement | null>(null);

	// Stopping a row filtering, standing on that row's own line at the middle. Each is built only
	// where it would do something, so on a row narrowing nothing there is no element at all and
	// the line is given none.
	let projects_clear = $state<HTMLElement | null>(null);
	let kinds_clear    = $state<HTMLElement | null>(null);

	const all_action      = $derived(Object.assign(new Action(), { element: all_button,      position: T_Position.left }));
	const projects_action = $derived(Object.assign(new Action(), { element: projects_button, position: T_Position.left }));
	const kinds_action    = $derived(Object.assign(new Action(), { element: kinds_button,    position: T_Position.left }));
	const tags_action     = $derived(Object.assign(new Action(), { element: tags_button,     position: T_Position.left }));
	const picking_action  = $derived(Object.assign(new Action(), { element: picking_control, position: T_Position.center }));
	const projects_clearer = $derived(Object.assign(new Action(), { element: projects_clear, position: T_Position.center }));
	const kinds_clearer    = $derived(Object.assign(new Action(), { element: kinds_clear,    position: T_Position.center }));
</script>

<!-- The four words that fold these sections away, built here rather than by the lines they stand
     on. Each is written out of sight, since the moment the browser has made it, it is taken and
     put on its line instead. -->
<div class='out_of_sight'>
	<button type='button' class='fold-word' bind:this={all_button}
		use:hit_target={{ id: 'list.fold.all', onpress: toggle_filters }}>{all_word}</button>
	<button type='button' class='fold-word' bind:this={projects_button}
		use:hit_target={{ id: 'list.fold.projects', onpress: () => fold('projects', show_projects) }}>{heading('projects', show_projects, project_word)}</button>
	<button type='button' class='fold-word' bind:this={kinds_button}
		use:hit_target={{ id: 'list.fold.kinds', onpress: () => fold('kinds', show_kinds) }}>{heading('kinds', show_kinds, kind_word)}</button>
	<button type='button' class='fold-word' bind:this={tags_button}
		use:hit_target={{ id: 'list.fold.tags', onpress: () => fold('tags', show_tags) }}>{heading('tags', show_tags, tags_word)}</button>
	<!-- One control holding two kinds: the three on the left are states, saying how the picked
	     tags narrow; the ones on the right are presses that change what is picked and leave the
	     state alone, so neither ever reads as picked — they answer under the cursor only.
	     With no tag picked there is nothing to clear, so that segment is not there at all; it
	     arrives with the first tag chosen. -->
	<!-- Clearing a row is something done, never something picked, so it stands apart from the
	     control it belongs to. It is drawn only where it would do something: one of the words is
	     picked, and there is more than one to pick from. With a single choice on offer there is
	     nowhere to go back to, so nothing is made and the line is given none. -->
	{#if $w_project !== '' && shown_projects.length > 1}
		<button class='clear' bind:this={projects_clear}
			use:hit_target={{ id: 'list.clear.projects', onpress: () => w_project.set(''),
				tip: 'show every project\'s guides' }}>clear</button>
	{/if}
	{#if $w_kind !== '' && kinds_offered > 1}
		<button class='clear' bind:this={kinds_clear}
			use:hit_target={{ id: 'list.clear.kinds', onpress: () => w_kind.set(''),
				tip: 'show every kind of guide' }}>clear</button>
	{/if}
	<span class='picking' bind:this={picking_control}>
		<!-- A picked one answers nothing: it is already what it says. -->
		<button class='segment' class:current={$w_tag_picking === T_Picking.any}
			use:hit_target={{ id: 'list.picking.any', tip: 'a file shows if it wears any one of the picked tags',
				onpress: $w_tag_picking === T_Picking.any ? undefined : () => pick_way(T_Picking.any) }}>any of</button>
		<button class='segment' class:current={$w_tag_picking === T_Picking.all}
			use:hit_target={{ id: 'list.picking.all', tip: 'a file shows only if it wears every picked tag',
				onpress: $w_tag_picking === T_Picking.all ? undefined : () => pick_way(T_Picking.all) }}>all of</button>
		<button class='segment' class:current={$w_tag_picking === T_Picking.but}
			use:hit_target={{ id: 'list.picking.but', tip: 'a file shows only if it wears none of the picked tags',
				onpress: $w_tag_picking === T_Picking.but ? undefined : () => pick_way(T_Picking.but) }}>any but</button>
		{#if $w_tags.length > 0}
			<button class='segment press'
				use:hit_target={{ id: 'list.picking.clear', onpress: clear_tags, tip: 'stop filtering by tag' }}>clear</button>
		{/if}
		<button class='segment press'
			use:hit_target={{ id: 'list.picking.invert', onpress: invert_tags, tip: 'pick exactly the tags that are not picked' }}>invert</button>
	</span>
</div>

<!-- With the other filters leaving nothing, a row has no words to offer. The control itself is
     left out then, since an empty one still draws its edge and reads as a sliver. -->
{#snippet projects_picker()}
	{#if shown_projects.length > 0}
	<div class='kinds' use:tip={'show just one project\'s guides'}>
		{#each shown_projects as project}
			{@const held = counts.get(project) ?? 0}
			<!-- One that would leave nothing still holds its place in the run, so it registers with
			     no press: the ones beside it must not answer for the space it stands in. -->
			<button class='segment' class:current={$w_project === project} class:empty={held === 0}
				use:hit_target={{ id: `list.project.${project}`,
					tip: held === 0 ? `nothing in "${project}" is left by the other filters`
						: $w_project === project ? 'show all project files' : `show only "${project}" files`,
					onpress: held > 0 ? () => choose_project(project) : undefined }}>{project}</button>
		{/each}
	</div>
	{/if}
{/snippet}

<div class='filters'>

	<!-- The search field takes the whole row, so the words looked for stay in reach whether or
	     not the picking rows show. Its type is "search", so the browser draws its own clear
	     cross at the right end once there is text — the same as ji's file search. -->
	<div class='top-row'>
		<input
			type='search'
			class='search'
			bind:value={$w_words}
			placeholder='search titles and descriptions'
			use:hit_target={{ id: 'list.field.search', tip: 'type a word to look for' }} />
	</div>

	<!-- The whole set of picking rows, as one section: its line carries the word that folds them
	     all away, and it holds three subsections — the projects, the kinds, the tags. It holds no
	     gap of its own, since each of those holds the gap at its own boundaries. -->
	<Section
		id='list.filters'
		holds_subsections
		gap={0}
		edge={T_Edge.thick}
		actions={[all_action]}
		folded={!$w_show_filters}>
		{#snippet holds()}
		<!-- The gap above the first line inside is this run's own: a section that holds
		     subsections holds none, and the first of them has nothing above it to stand clear of. -->
		<div class='picking-rows'>
			<!-- Each section's line names what sits under it, so the word reads as a heading for
			     the row that follows. -->
			<Section
				id='list.projects'
				gap={k.gap.big}
				actions={[projects_action, projects_clearer]}
				folded={!show_projects}>
				{#snippet holds()}
					<div class='paired-rows'>
						{@render projects_picker()}
					</div>
				{/snippet}
			</Section>

			<Section
				id='list.kinds'
				gap={k.gap.big}
				actions={[kinds_action, kinds_clearer]}
				folded={!show_kinds}>
				{#snippet holds()}
					<div class='paired-rows'>
					{#if kinds_offered > 0}
					<div class='kinds' use:tip={'show particular kinds of guide'}>
						<!-- The files carrying no labels at all — how they are found, so they can be
						     opened and given some. With every file already labeled there is nothing
						     for it to leave, so it goes rather than standing there unanswering. -->
						{#if bare > 0 || $w_kind === UNLABELED}
							<button class='segment' class:current={$w_kind === UNLABELED}
								use:hit_target={{ id: `list.kind.${UNLABELED}`, onpress: () => choose_kind(UNLABELED),
									tip: 'show only the files that carry no labels' }}>none</button>
						{/if}
						{#each shown_kinds as kind}
							{@const in_reach = kinds.includes(kind)}
							<button class='segment' class:current={$w_kind === kind} class:empty={!in_reach}
								use:hit_target={{ id: `list.kind.${kind}`,
									tip: in_reach ? `${$w_kind === kind ? 'remove' : 'add'} "${kind}" kind`
										: `nothing of that kind is left by the other filters`,
									onpress: in_reach ? () => choose_kind(kind) : undefined }}>{kind}</button>
						{/each}
					</div>
					{/if}
					</div>
				{/snippet}
			</Section>

			<!-- Folded under a folded kinds row, it asks for no gap at all — which is how a section
			     says it stands flat. Its line is then the last thing in the picking rows and the
			     count row below draws none, so nothing stands between that line and the list. With
			     the kinds open it stands as it is, folded or not. -->
			<Section
				id='list.tags'
				gap={foot_is_all_folds(!show_kinds, !show_tags) ? 0 : k.gap.big}
				actions={[tags_action, picking_action]}
				fills_when_bare
				onbare={() => toggle_all_areas(showing_areas.map((one) => one.name))}
				bare_says={$w_areas_open.length === 0 ? 'expand tags' : 'collapse tags'}
				folded={!show_tags}>
				{#snippet holds()}
					<!-- Twenty-four words in one row is more than an eye can scan, so the tags are
					     gathered into six areas, each folding away behind its own name. Stopping
					     filtering by tag keeps its own plain pill at the front. -->
					<!-- A click on the bare space beside the pills shuts every area at once, so getting
					     back to six words never means pressing six crosses. -->
					<!-- Each area is wrapped so it can be slid: opening one grows it from a word to a
					     run of segments, and the pills after it move a long way at once. The wrapper
					     is what carries the slide, and areas with nothing left to show are left out
					     here rather than inside — an empty wrapper would still take a gap. -->
					<div class='tags' class:named={names_riding} bind:this={tags_row} use:smooth_height>
						{#each showing_areas as area (area.name)}
							<span class='pill-slot' transition:fade={{ duration: FADE }}>
								<Big_Pill {area} in_reach={tags_in_use} chosen={$w_tags} ontoggle={toggle_tag} />
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
	/* Where the four fold words are written before their lines take them. Each is taken out of
	   here on the very next drawing, so nothing is ever seen in this spot. */
	.out_of_sight {
		display : none;
	}

	/* A word that folds its section away, standing on the line above it. Its page-colored
	   background masks the line behind it. The edge is held see-through and counted inside the
	   word's own space, so the hover edge adds no width and the word never shifts. */
	.fold-word {
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		color         : var(--darkgray);
		padding       : 0 var(--gap);
		box-sizing    : border-box;
		background    : var(--section-bg, var(--bg));
		font-family   : inherit;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.fold-word:global([data-hit]) {
		border-color : var(--darkgray);
		background   : var(--hover);
	}

	/* Sections stack flush against each other: each already holds its own gap above and below
	   what it shows, so a gap here would be a second helping of the same thing. */
	.filters {
		flex-direction : column;
		display        : flex;
		gap            : 0;
	}

	/* The toggle at the far left, the search field taking whatever is left. Not a section, so it
	   holds its own gap below — the gap the line under it would otherwise stand clear of. */
	.top-row {
		padding-bottom : var(--gap-big);
		min-height     : var(--height);
		gap            : var(--gap);
		align-items    : center;
		display        : flex;
	}

	/* The three picking rows, taken as one run. Its own gap above is what stands between the
	   line over the whole set and the first line inside it. */
	.picking-rows {
		flex-direction : column;
		display        : flex;
		gap            : 0;
	}

	/* The strip between the line above and the first picking row's own line. It was bare space;
	   it is a block of its own now so it can take the accent — reaching out to the box's edges the
	   way a section's body does, and with no line down its middle, since nothing here is folded. */
	.picking-rows::before {
		margin     : 0 calc(var(--gap) * -1);
		background : var(--accent);
		height     : var(--gap-big);
		flex       : 0 0 auto;
		content    : '';
	}

	/* The clearing pill and the control it belongs to, centered together with one gap between
	   them — the same gap the tag pills hold. */
	.paired-rows {
		gap             : var(--gap);
		justify-content : center;
		align-items     : center;
		display         : flex;
	}

	/* One pill with a segment per kind; the chosen one fills with the accent. */
	.kinds {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		height        : var(--height);
		background    : var(--white);
		box-sizing    : border-box;
		align-self    : center;
		overflow      : hidden;
		display       : flex;
		flex-shrink   : 0;
	}

	/* A button keeps no text size of its own, so it is said here — the same size the tags read at,
	   so every picking row is one size. */
	.segment {
		padding    : var(--pad-control);
		font-size  : var(--font-tiny);
		background : transparent;
		color      : var(--text);
		cursor     : pointer;
		white-space: nowrap;
		border     : none;
	}

	.segment:not(:last-child) {
		border-right : var(--thick) solid var(--black);
	}

	.segment.current {
		color      : var(--text-on-accent);
		background : var(--accent);
		cursor     : default;
	}

	.segment:not(.current):not(.empty):global([data-hit]) {
		background : var(--hover);
	}

	/* Clearing a row stands apart from its control, as a pill of its own. It is never a state —
	   it is something done, not something picked — so it never reads as picked, filling only
	   under the cursor and filling stronger while it is held. */
	/* It stands on its row's own line beside the word that folds the row, so it takes that word's
	   size — the same text and the same edge thickness, which makes both boxes the same height.
	   Its height is whatever that text needs; nothing is fixed. */
	.clear {
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : 0 var(--gap);
		font-size     : var(--font-faint);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		align-self    : center;
		cursor        : pointer;
		white-space   : nowrap;
		flex-shrink   : 0;
	}

	.clear:global([data-hit]) {
		background : var(--hover);
	}


	/* A collection with no guides yet: grayed and dead to the touch. */
	.segment.empty {
		color  : var(--gray);
		cursor : default;
	}

	/* Twenty-two tags won't sit in one row, so they wrap. Any number can be on at once. */
	/* The wrapper that carries a pill's slide. It hugs whatever it holds, so the row measures
	   exactly as it did before there was anything to slide. */
	.pill-slot {
		display : inline-flex;
	}

	/* When a pill grows or shrinks enough to take a row of its own, or to give one back, this box
	   changes height and everything under it moves. That change takes the same time the pill
	   itself takes, so the two read as one movement rather than a slide and then a jump. */
	/* The rows keep their own height whatever the box is told to be. Left to stretch, they would
	   grow to fill a stated height — and since that height is worked out from how tall they are,
	   each would make the other larger, over and over. */
	/* Nothing is clipped here: each pill's own name rides above its top edge, so a box that cut
	   off what falls outside it would take the names with it. */
	/* With a name riding above a pill in the topmost row, the run holds one gap above itself so
	   that name stands clear of the line overhead. It is a margin, so it sits outside the height
	   this box is told to hold and never joins the slide. */
	.tags.named {
		margin-top : var(--gap);
	}


	.tags {
		transition      : height var(--slide-rows) linear;
		gap             : var(--gap);
		align-content   : flex-start;
		justify-content : center;
		align-items     : center;
		display         : flex;
		flex-wrap       : wrap;
	}

	/* The control saying how the picked tags narrow, holding the two presses that change what is
	   picked. It stands on the tags line beside the word that folds them, so it takes that word's own
	   size — the same text and the same edge thickness, which makes both boxes exactly as tall
	   as each other. Its height is whatever that text needs; nothing is fixed. */
	.picking {
		border        : var(--thick-small) solid var(--black);
		border-radius : var(--radius-pill);
		font-size     : var(--font-faint);
		background    : var(--white);
		display       : inline-flex;
		box-sizing    : border-box;
		align-items   : stretch;
		overflow      : hidden;
		flex-shrink   : 0;
	}

	/* A button keeps no text size of its own, so it is said here — without it each segment falls
	   back to whatever the browser draws a button at, which is larger than the word beside it. */
	.picking .segment {
		font-size : var(--font-faint);
		padding   : 0 var(--gap);
	}

	/* A press is never a state, so it takes the fill only while the cursor is on it. The stronger
	   fill it wore while held is gone: the manager says pressed and released and nothing between,
	   so nothing knows when a button is being held down. */
	.picking .segment.press:global([data-hit]) {
		background : var(--hover);
	}

	.search {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		height        : var(--height);
		background    : var(--white);
		font-size     : var(--font);
		color         : var(--text);
		box-sizing    : border-box;
		width         : 100%;
	}

	/* With the cursor in it, the field's own edge thickens in the accent rather than the
	   browser drawing a ring of its own — which sat outside the pill and followed neither its
	   curve nor its width. The edge is drawn inside, so nothing moves. */
	.search:focus,
	.search:focus-visible {
		box-shadow   : inset 0 0 0 var(--thick) var(--accent);
		border-color : var(--accent);
		outline      : none;
	}
</style>
