<script lang='ts'>
	import { w_project, w_kind, w_tags, w_words } from '../../ts/managers/Filters';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { shut_all_areas, UNLABELED } from '../../ts/managers/Filters';
	import { T_Bundle, T_Kind } from '../../ts/types/File';
	import { TAG_AREAS } from '../../ts/types/Tag_Areas';
	import Separator from '../support/Separator.svelte';
	import Big_Pill from '../support/Big_Pill.svelte';
	import { guides } from '../../ts/managers/Files';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';

	// Whether the three picking rows show at all. The words looked for stay either way —
	// they are the one filter worth keeping in reach while the list has the height.
	const w_show_filters = preferences.persistent<boolean>(T_Preference.show_filters, true);

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
	let tags_in_use = $derived.by(() => { $w_project; $w_kind; $w_words; return $w_ready ? guides.tags_present() : []; });
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
	}

	// Each row can be folded away by pressing the word above it. Folded, that word says how to
	// get the row back and what is picked, so nothing is hidden without a way out. With either
	// of the top two folded they take separate bars, since one word over two halves would
	// point at the wrong place. Which rows are folded is remembered between visits, named
	// rather than numbered so adding a row later cannot shift the meaning of what was saved.
	const w_folded = preferences.persistent<string[]>(T_Preference.filters_folded, []);

	let show_projects = $derived(!$w_folded.includes('projects'));
	let show_kinds = $derived(!$w_folded.includes('kinds'));
	let show_tags = $derived(!$w_folded.includes('tags'));

	let project_word = $derived($w_project === '' ? 'all' : $w_project);
	let kind_word = $derived($w_kind === '' ? 'all' : $w_kind);
	let tags_word = $derived($w_tags.length === 0 ? 'all' : $w_tags.join(', '));

	// What the word on the bar says: just the name while the row is there, the name and what
	// is picked while it is folded away.
	function heading(name: string, shown: boolean, picked: string): string {
		return shown ? name : `${name} ➜ ${picked}`;
	}

	function fold(name: string, away: boolean) {
		w_folded.update((names) => away ? [...names, name] : names.filter((one) => one !== name));
		debug.log(`Filters: the ${name} row is now ${away ? 'folded away' : 'shown'}.`);
	}

	// One word above them all, saying what every picking row holds — in the order they appear,
	// and leaving out any row narrowing nothing, since "all" says nothing worth the room.
	// Pressing it folds the whole set away or brings it back.
	let all_picked = $derived([project_word, kind_word, tags_word]
		.filter((one) => one !== 'all').join(', '));
	let all_word = $derived($w_show_filters ? '✂ filters'
		: `✂ filters ➜ ${all_picked === '' ? 'all' : all_picked}`);
</script>

{#snippet projects_picker()}
	<div class='kinds' use:tip={'show just one project\'s guides'}>
		<button class='segment' class:current={$w_project === ''} onclick={() => w_project.set('')}>all</button>
		{#each shown_projects as project}
			{@const held = counts.get(project) ?? 0}
			<button class='segment' class:current={$w_project === project} class:empty={held === 0}
				use:tip={held === 0 ? `nothing in ${project} is left by the other filters` : false}
				onclick={() => { if (held > 0) { choose_project(project); } }}>{project}</button>
		{/each}
	</div>
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
			use:tip={'type a word to look for'} />
	</div>

	<!-- One word over the whole set, saying what every row holds and folding them all at a
	     press anywhere along the line. -->
	<div>
		<Separator at_left thickness={k.thickness.huge} title={all_word} onclick={toggle_filters}/>
	</div>

	{#if $w_show_filters}
		<!-- Each sep names what sits under it, so the words read as a heading for the row
		     that follows. -->
		<div>
			<Separator at_left title={heading('projects', show_projects, project_word)}
				onclick={() => fold('projects', show_projects)}/>
		</div>
		{#if show_projects}
			<div class='paired-rows'>{@render projects_picker()}</div>
		{/if}

		<div>
			<Separator at_left title={heading('kinds', show_kinds, kind_word)}
				onclick={() => fold('kinds', show_kinds)}/>
		</div>

		{#if show_kinds}
			<div class='kinds' use:tip={'show particular kinds of guide'}>
				<button class='segment' class:current={$w_kind === ''} onclick={() => w_kind.set('')}>all</button>
				<!-- The files carrying no labels at all — how they are found, so they can be
				     opened and given some. -->
				<button class='segment' class:current={$w_kind === UNLABELED} class:empty={bare === 0}
					use:tip={bare === 0 ? 'every file left by the other filters carries labels' : 'show only the files that carry no labels'}
					onclick={() => { if (bare > 0) { choose_kind(UNLABELED); } }}>none</button>
				{#each shown_kinds as kind}
					{@const in_reach = kinds.includes(kind)}
					<button class='segment' class:current={$w_kind === kind} class:empty={!in_reach}
						use:tip={in_reach ? false : `nothing of that kind is left by the other filters`}
						onclick={() => { if (in_reach) { choose_kind(kind); } }}>{kind}</button>
				{/each}
			</div>
		{/if}

		<div>
			<Separator at_left title={heading('tags', show_tags, tags_word)}
				onclick={() => fold('tags', show_tags)}/>
		</div>

		{#if show_tags}
			<!-- Twenty-four words in one row is more than an eye can scan, so the tags are
			     gathered into six areas, each folding away behind its own name. Stopping
			     filtering by tag keeps its own plain pill at the front. -->
			<!-- A click on the bare space beside the pills shuts every area at once, so getting
			     back to six words never means pressing six crosses. -->
			<div class='tags' role='presentation' onclick={(event) => { if (event.target === event.currentTarget) { shut_all_areas(); } }}>
				<button class='tag' class:current={$w_tags.length === 0} onclick={clear_tags} use:tip={'stop filtering by tag'}>all</button>
				{#each TAG_AREAS as area (area.name)}
					<Big_Pill {area} in_reach={tags_in_use} chosen={$w_tags} ontoggle={toggle_tag} />
				{/each}
			</div>
		{/if}
	{/if}
</div>
<!-- The plain heavy line closing the picking rows off from the list. With the rows folded
     away there is nothing for it to close, so it goes. -->
{#if $w_show_filters}
	<Separator thickness={k.thickness.huge}/>
{/if}

<style>
	.filters {
		gap            : var(--gap-big);
		flex-direction : column;
		display        : flex;
	}

	/* The toggle at the far left, the search field taking whatever is left. */
	.top-row {
		min-height  : var(--height);
		gap         : var(--gap);
		align-items : center;
		display     : flex;
	}

	/* The purposes and the projects share one row: the space before the first, between the
	   two, and after the second are all the same. */
	.paired-rows {
		justify-content : space-evenly;
		align-items     : center;
		display         : flex;
	}

	/* One pill with a segment per kind; the chosen one fills with the accent. */
	.kinds {
		border        : var(--thick) solid var(--black);
		height        : var(--height);
		border-radius : var(--radius-pill);
		font-size     : var(--font);
		background    : var(--white);
		box-sizing    : border-box;
		align-self    : center;
		overflow      : hidden;
		display       : flex;
		flex-shrink   : 0;
	}

	.segment {
		padding    : var(--pad-control);
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

	.segment:not(.current):not(.empty):hover {
		background : var(--hover);
	}

	/* A collection with no guides yet: grayed and dead to the touch. */
	.segment.empty {
		color  : var(--gray);
		cursor : default;
	}

	/* Twenty-two tags won't sit in one row, so they wrap. Any number can be on at once. */
	.tags {
		gap             : var(--gap);
		justify-content : center;
		display         : flex;
		flex-wrap       : wrap;
	}

	/* The one plain pill in the row. It stands the height of the double-bordered areas beside it,
	   so the row reads as one line of pills rather than two sizes. */
	.tag {
		border        : var(--thick) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : 0 var(--gap);
		font-size     : var(--font-tiny);
		height        : var(--height);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.tag.current {
		background : var(--accent);
		color      : var(--text-on-accent);
	}

	.tag:not(.current):hover {
		background : var(--hover);
	}

	.search {
		border        : var(--thick) solid var(--black);
		height        : var(--height);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		width         : 100%;
	}

	/* With the cursor in it, the field's own edge thickens in the accent rather than the
	   browser drawing a ring of its own — which sat outside the pill and followed neither its
	   curve nor its width. The edge is drawn inside, so nothing moves. */
	.search:focus,
	.search:focus-visible {
		border-color : var(--accent);
		box-shadow   : inset 0 0 0 var(--thick) var(--accent);
		outline      : none;
	}
</style>
