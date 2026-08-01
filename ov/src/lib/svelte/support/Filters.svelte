<script lang='ts'>
	import { w_project, w_kind, w_tags, w_words } from '../../ts/managers/Filters';
	import { T_Bundle } from '../../ts/types/Guide';
	import { guides } from '../../ts/managers/Guides';
	import { tip } from '../../ts/utilities/Tooltip';
	import Separator from './Separator.svelte';

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

	<div class='kinds' use:tip={'show one project\'s guides at a time'}>
		<button class='segment' class:current={$w_project === ''} onclick={() => w_project.set('')}>all</button>
		{#each projects as project}
			{@const held = counts.get(project) ?? 0}
			<button class='segment' class:current={$w_project === project} class:empty={held === 0}
				use:tip={held === 0 ? `${project} has no guides yet` : false}
				onclick={() => choose_project(project)}>{project}</button>
		{/each}
	</div>

	<Separator title='choose a project from above'/>

	<div class='kinds' use:tip={'show one kind of guide at a time'}>
		<button class='segment' class:current={$w_kind === ''} onclick={() => w_kind.set('')}>all</button>
		{#each kinds as kind}
			<button class='segment' class:current={$w_kind === kind} onclick={() => choose_kind(kind)}>{kind}</button>
		{/each}
	</div>

	<Separator title='choose a kind from above'/>

	<div class='tags'>
		<button class='tag' class:current={$w_tags.length === 0} onclick={clear_tags} use:tip={'stop filtering by tag'}>any tag</button>
		{#each tags as tag}
			<button class='tag' class:current={$w_tags.includes(tag)} onclick={() => toggle_tag(tag)} use:tip={`show guides tagged ${tag}`}>{tag}</button>
		{/each}
	</div>

	<Separator title='choose tags from above'/>

	<!-- Its type is "search", so the browser draws its own clear cross at the right end
	     once there is text — the same as ji's file search. -->
	<input
		class='search'
		type='search'
		placeholder='search titles and descriptions'
		bind:value={$w_words}
		use:tip={'type a word to look for'} />

</div>

<style>
	.filters {
		flex-direction : column;
		display        : flex;
		gap            : var(--gap);
	}

	/* One pill with a segment per kind; the chosen one fills with the accent. */
	.kinds {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		font-size     : var(--font-base);
		background    : var(--white);
		box-sizing    : border-box;
		border-radius : var(--radius-pill);
		overflow      : hidden;
		display       : flex;
		align-self    : center;
		flex-shrink   : 0;
	}

	.segment {
		padding    : var(--pad-control);
		background : transparent;
		color      : var(--text);
		white-space: nowrap;
		cursor     : pointer;
		border     : none;
	}

	.segment:not(:last-child) {
		border-right : var(--thickness-normal) solid var(--black);
	}

	.segment.current {
		background : var(--accent);
		color      : var(--text-on-accent);
		cursor     : default;
	}

	.segment:not(.current):not(.empty):hover {
		background : var(--hover);
	}

	/* A collection with no guides yet: grayed and dead to the touch. */
	.segment.empty {
		color  : var(--lightgray);
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
		white-space   : nowrap;
		cursor        : pointer;
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
		border-radius : var(--radius-pill);
		height        : var(--height-control);
		padding       : var(--pad-control);
		font-size     : var(--font-base);
		background    : var(--white);
		color         : var(--text);
		box-sizing    : border-box;
		width         : 100%;
	}
</style>
