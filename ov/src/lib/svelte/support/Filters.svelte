<script lang='ts'>
	import { w_project, w_kind, w_tags, w_words } from '../../ts/managers/Filters';
	import { preferences, T_Preference } from '../../ts/managers/Preferences';
	import { guides } from '../../ts/managers/Guides';
	import { tip } from '../../ts/utilities/Tooltip';
	import { T_Bundle } from '../../ts/types/Guide';
	import { debug } from '../../ts/common/Debug';
	import { k } from '../../ts/common/Constants';
	import Separator from './Separator.svelte';

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

	// The files are read at launch, so what kinds and tags exist isn't known until that
	// finishes. Both lists fill themselves in the moment it does.
	const w_ready = guides.w_ready;
	let kinds = $derived($w_ready ? guides.kinds_present() : []);
	let tags  = $derived($w_ready ? guides.tags_present()  : []);

	// The collections, in the order they were swept. One with no guides folder yet holds
	// no files, so its segment is shown but dead — picking it could only ever empty the
	// list. It wakes up on its own the day that collection gains a guide.
	const projects = Object.values(T_Bundle);
	let counts = $derived($w_ready ? new Map(projects.map((p) => [p, guides.files_in(p)])) : new Map());

	function choose_project(project: string) {
		if ((counts.get(project) ?? 0) === 0) { return; }
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
</script>

<div class='filters'>

	<!-- The toggle hugs the far left of this row; the search field takes the rest, so the
	     words looked for stay in reach whether or not the picking rows show.
	     Its type is "search", so the browser draws its own clear cross at the right end
	     once there is text — the same as ji's file search. -->
	<div class='top-row'>
		<button class='filters-button' onclick={toggle_filters}>
			{`${$w_show_filters ? 'hide' : 'show'} filters`}
		</button>
		<input
			type='search'
			class='search'
			bind:value={$w_words}
			placeholder='search titles and descriptions'
			use:tip={'type a word to look for'} />
	</div>

	{#if $w_show_filters}
		<!-- Each sep names what sits under it, so the words read as a heading for the
		     row that follows. -->
		<Separator title='projects'/>

		<div class='kinds' use:tip={'show just one project\'s guides'}>
			<button class='segment' class:current={$w_project === ''} onclick={() => w_project.set('')}>all</button>
			{#each projects as project}
				{@const held = counts.get(project) ?? 0}
				<button class='segment' class:current={$w_project === project} class:empty={held === 0}
					use:tip={held === 0 ? `${project} has no guides yet` : false}
					onclick={() => choose_project(project)}>{project}</button>
			{/each}
		</div>

		<Separator title='kinds'/>

		<div class='kinds' use:tip={'show particular kinds of guide'}>
			<button class='segment' class:current={$w_kind === ''} onclick={() => w_kind.set('')}>all</button>
			{#each kinds as kind}
				<button class='segment' class:current={$w_kind === kind} onclick={() => choose_kind(kind)}>{kind}</button>
			{/each}
		</div>

		<Separator title='tags'/>

		<div class='tags'>
			<button class='tag' class:current={$w_tags.length === 0} onclick={clear_tags} use:tip={'stop filtering by tag'}>any tag</button>
			{#each tags as tag}
				<button class='tag' class:current={$w_tags.includes(tag)} onclick={() => toggle_tag(tag)} use:tip={`show guides tagged "${tag}"`}>{tag}</button>
			{/each}
		</div>
	{/if}
</div>
<Separator thickness={k.separator.huge}/>

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

	.filters-button {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		border-radius : var(--radius-pill);
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		cursor        : pointer;
		white-space   : nowrap;
	}

	.filters-button:hover {
		background : var(--hover);
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
		justify-content : center;
		display         : flex;
		flex-wrap       : wrap;
		gap             : var(--gap-tight);
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
</style>
