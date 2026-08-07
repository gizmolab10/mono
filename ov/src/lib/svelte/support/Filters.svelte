<script lang='ts'>
	import { w_purposes, w_project, w_kind, w_tags, w_words } from '../../ts/managers/Filters';
	import { toggle_purpose, shut_all_areas } from '../../ts/managers/Filters';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { T_Bundle, T_Kind, T_Purpose } from '../../ts/types/Guide';
	import { show_status } from '../../ts/managers/Status';
	import { TAG_AREAS } from '../../ts/types/Tag_Areas';
	import { guides } from '../../ts/managers/Guides';
	import { tip } from '../../ts/utilities/Tooltip';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import Separator from './Separator.svelte';
	import Big_Pill from './Big_Pill.svelte';
	import { get } from 'svelte/store';

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

	// The three purposes: how to work, how a thing was built, and the work notes.
	const PURPOSES = Object.values(T_Purpose);

	function choose_purpose(which: T_Purpose) {
		const done = toggle_purpose(which);
		debug.log(done
			? `Showing: "${which}" was turned ${get(w_purposes).includes(which) ? 'on' : 'off'}.`
			: `Showing: "${which}" is the only one left on, so it stays.`);
		if (!done) { show_status(`${which} is the only one showing — at least one must stay on`); }
	}

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
	let kinds = $derived.by(() => { $w_purposes; $w_project; $w_tags; $w_words; return $w_ready ? guides.kinds_present() : []; });
	let tags_in_use = $derived.by(() => { $w_purposes; $w_project; $w_kind; $w_words; return $w_ready ? guides.tags_present() : []; });
	const projects = Object.values(T_Bundle);
	let counts = $derived.by(() => {
		$w_purposes; $w_kind; $w_tags; $w_words;
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

	// Side by side while there is room for both, stacked when there isn't. The room wanted is
	// the two pickers' own widths plus the three equal spaces around them. Each picker is only
	// ever as wide as its own words, stacked or not, so the answer cannot flip back and forth.
	const ROOM_AROUND = k.gap.fat * 3;
	let box_width = $state(0);
	let purpose_box: HTMLElement | undefined = $state();
	let projects_box: HTMLElement | undefined = $state();
	let both_widths = $state(0);

	$effect(() => {
		shown_projects;                                  // measure again when the words change
		const purpose = purpose_box?.offsetWidth ?? 0;
		const projects = projects_box?.offsetWidth ?? 0;
		if (purpose > 0 && projects > 0) { both_widths = purpose + projects; }
	});

	let stacked = $derived(box_width > 0 && both_widths > 0 && both_widths + ROOM_AROUND > box_width);

	// Each row can be folded away by pressing the word above it. Folded, that word says how to
	// get the row back and what is picked, so nothing is hidden without a way out. With either
	// of the top two folded they take separate bars, since one word over two halves would
	// point at the wrong place. Which rows are folded is remembered between visits, named
	// rather than numbered so adding a row later cannot shift the meaning of what was saved.
	const w_folded = preferences.persistent<string[]>(T_Preference.filters_folded, []);

	let show_purposes = $derived(!$w_folded.includes('purpose'));
	let show_projects = $derived(!$w_folded.includes('projects'));
	let show_kinds = $derived(!$w_folded.includes('kinds'));
	let show_tags = $derived(!$w_folded.includes('tags'));

	let purposes_word = $derived($w_purposes.join(', '));
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
	let all_picked = $derived([purposes_word]
		.filter((one) => one !== 'all').join(', '));
	let all_word = $derived($w_show_filters ? '✂ filters'
		: `✂ filters ➜ ${all_picked === '' ? 'all' : all_picked}`);
</script>

<!-- The two pickers, written once and placed either way. -->
{#snippet purpose_picker()}
	<!-- Which corpora show. Both can be on; the last one on cannot be turned off, since
	     a list that can go blank for no visible reason is a trap. -->
	<div class='kinds' bind:this={purpose_box} use:tip={'show files, designs, or both'}>
		{#each PURPOSES as one}
			{@const asleep = one === T_Purpose.work}
			<button class='segment' class:current={$w_purposes.includes(one)} class:empty={asleep}
				use:tip={asleep ? 'work notes are not swept yet' : $w_purposes.includes(one) ? `stop showing ${one}` : `also show ${one}`}
				onclick={() => { if (!asleep) { choose_purpose(one); } }}>{one}</button>
		{/each}
	</div>
{/snippet}

{#snippet projects_picker()}
	<div class='kinds' bind:this={projects_box} use:tip={'show just one project\'s guides'}>
		<button class='segment' class:current={$w_project === ''} onclick={() => w_project.set('')}>all</button>
		{#each shown_projects as project}
			{@const held = counts.get(project) ?? 0}
			<button class='segment' class:current={$w_project === project} class:empty={held === 0}
				use:tip={held === 0 ? `nothing in ${project} is left by the other filters` : false}
				onclick={() => { if (held > 0) { choose_project(project); } }}>{project}</button>
		{/each}
	</div>
{/snippet}

<div class='filters' bind:clientWidth={box_width}>

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
	<div class:folded={$w_show_filters}>
		<Separator at_left thickness={k.separator.huge} title={all_word} onclick={toggle_filters}/>
	</div>

	{#if $w_show_filters}
		<!-- Each sep names what sits under it, so the words read as a heading for the row
		     that follows. With room for both, one bar carries two words, each landing over
		     its own picker; without it, each picker gets its own bar and its own word,
		     purpose above projects. -->
		{#if stacked || !show_purposes || !show_projects}
			<div class:folded={!show_purposes}>
				<Separator at_left title={heading('purpose', show_purposes, purposes_word)}
					onclick={() => fold('purpose', show_purposes)}/>
			</div>
			{#if show_purposes}
				<div class='paired-rows'>{@render purpose_picker()}</div>
			{/if}
			<div class:folded={!show_projects}>
				<Separator at_left title={heading('projects', show_projects, project_word)}
					onclick={() => fold('projects', show_projects)}/>
			</div>
			{#if show_projects}
				<div class='paired-rows'>{@render projects_picker()}</div>
			{/if}
		{:else}
			<Separator at_left title={['purpose', 'projects']}
				onclick={(_event, which) => fold(which === 0 ? 'purpose' : 'projects', true)}/>
			<div class='paired-rows'>
				{@render purpose_picker()}
				{@render projects_picker()}
			</div>
		{/if}

		<div class:folded={!show_kinds}>
			<Separator at_left title={heading('kinds', show_kinds, kind_word)}
				onclick={() => fold('kinds', show_kinds)}/>
		</div>

		{#if show_kinds}
			<div class='kinds' use:tip={'show particular kinds of guide'}>
				<button class='segment' class:current={$w_kind === ''} onclick={() => w_kind.set('')}>all</button>
				{#each shown_kinds as kind}
					{@const in_reach = kinds.includes(kind)}
					<button class='segment' class:current={$w_kind === kind} class:empty={!in_reach}
						use:tip={in_reach ? false : `nothing of that kind is left by the other filters`}
						onclick={() => { if (in_reach) { choose_kind(kind); } }}>{kind}</button>
				{/each}
			</div>
		{/if}

		<div class:folded={!show_tags}>
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
	<Separator thickness={k.separator.huge}/>
{/if}

<style>
	.filters {
		gap            : var(--gap);
		flex-direction : column;
		display        : flex;
	}

	/* The toggle at the far left, the search field taking whatever is left. */
	.top-row {
		min-height  : var(--height-control);
		gap         : var(--gap);
		align-items : center;
		display     : flex;
	}

	/* With its row folded away, a bar has nothing below it but the next bar — so it holds a
	   gap of its own, or the words on the two would crowd. */
	.folded {
		margin-bottom : var(--gap);
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
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		border-radius : var(--radius-pill);
		font-size     : var(--font-base);
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
		border-right : var(--thickness-normal) solid var(--black);
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

	.tag {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-label);
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
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-base);
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
		box-shadow   : inset 0 0 0 var(--thickness-normal) var(--accent);
		outline      : none;
	}
</style>
