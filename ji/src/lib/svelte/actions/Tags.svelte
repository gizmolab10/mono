<script lang='ts'>
	import { databases } from '../../ts/database/Databases';
	import type { T_Match } from '../../ts/managers/Search';
	import { w_db_changed } from '../../ts/types/Signal';
	import { debug } from '../../ts/common/Debug';
	import type { Snippet } from 'svelte';

	// Pick one or more tags. Shows every tag in the active store as a chip;
	// clicking toggles it. The chosen tag ids are shared with the parent (the add
	// flow tags a drop, search filters). Live off the store-changed tick.

	// `selected` is the chosen set (the add flow binds it). `mode` is the all/any
	// match; a caller that binds it gets the toggle shown beside the chips (the
	// filter does), one that omits it (the per-row edit picker) gets no toggle.
	// `onadd` gives a caller that wants it an always-shown "add tags" button at the
	// right of the chips (the filter opens the new-tag view with it). `ontoggle` lets
	// a caller react to each click directly — documents uses it to add/remove a tag
	// right away. `trailing` renders after the last chip, same row.
	let { selected = $bindable(new Set<string>()), mode = $bindable<T_Match | undefined>(undefined), onadd, ontoggle, trailing }:
		{ selected?: Set<string>; mode?: T_Match; onadd?: () => void; ontoggle?: (id: string, on: boolean) => void; trailing?: Snippet } = $props();

	// Copy the list so each change yields a new array — the store mutates its list
	// in place, and a same-reference return would be seen as unchanged (no redraw).
	const tags = $derived.by(() => {
		$w_db_changed;
		return [...databases.active.tags];
	});

	function toggle(id: string) {
		const on = !selected.has(id);
		const next = new Set(selected);
		if (on) { next.add(id); } else { next.delete(id); }
		selected = next;
		ontoggle?.(id, on);
		debug.log(`Tag picker: ${next.size} of ${tags.length} tag(s) now chosen.`);
	}

	function toggle_mode() {
		const next = mode === 'all' ? 'any' : 'all';
		debug.log(`Match mode toggled from ${mode} to ${next}.`);
		mode = next;
	}

	function add_clicked(event: MouseEvent) {
		event.stopPropagation();                          // don't let this reach the background clearer
		debug.log('Add-a-tag button clicked — opening the new-tag view.');
		onadd?.();
	}
</script>

<div class='picker'>
	{#if mode !== undefined && tags.length > 0}
		<!-- The any/all toggle sits right beside the chips; only shown to a caller
		     that binds the match mode (the filter), and only when there are tags. -->
		<div class='logic-choice'>
			{#each (['all', 'any'] as const) as m}
				<button class='logic-choice-segment' class:current={mode === m} onclick={toggle_mode}>{m}</button>
			{/each}
		</div>
	{/if}
	{#if tags.length > 0}
		<!-- The tags as one joined segmented pill; several segments can be lit at once. -->
		<div class='tags'>
			{#each tags as tag}
				<button class='chip' class:on={selected.has(tag.id)} onclick={() => toggle(tag.id)}>{tag.name}</button>
			{/each}
		</div>
	{/if}
	{@render trailing?.()}
	{#if onadd}
		<!-- A separate button to the right of the pill: opens the new-tag view. -->
		<button class='add' onclick={(e) => add_clicked(e)}>add tags</button>
	{/if}
</div>

<style>
	.picker {
		gap             : var(--gap-fat);
		align-items     : center;
		justify-content : center;
		display         : flex;
	}

	.logic-choice {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		box-sizing    : border-box;
		border-radius : var(--radius-pill);
		background    : var(--white);
		overflow      : hidden;
		display       : flex;
	}

	.logic-choice-segment {
		padding    : var(--pad-control);
		font-size  : var(--font-label);
		background : transparent;
		color      : var(--text);
		cursor     : pointer;
		border     : none;
	}

	.logic-choice-segment:not(:last-child) {
		border-right : var(--thickness-normal) solid var(--black);
	}

	.logic-choice-segment.current {
		background : var(--accent);
	}

	.logic-choice-segment:not(.current):hover {
		background : var(--hover);
	}

	/* The tags as one joined segmented pill, like the all/any control — but any
	   number of segments can be lit. Wraps to more rows when the tags are many. */
	.tags {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : var(--radius-pill);
		min-height    : var(--height-control);
		box-sizing    : border-box;
		background    : var(--white);
		overflow      : hidden;
		flex-wrap     : wrap;
		display       : flex;
	}

	.chip {
		padding    : var(--pad-control);
		font-size  : var(--font-label);
		background : transparent;
		color      : var(--text);
		cursor     : pointer;
		border     : none;
	}

	.chip:not(:last-child) {
		border-right : var(--thickness-normal) solid var(--black);
	}

	.chip.on {
		background : var(--accent);
	}

	.chip:not(.on):hover {
		background : var(--hover);
	}

	/* The add-a-tag button, quieter than a chip (no fill) so it reads as an action
	   rather than a tag. */
	.add {
		border        : var(--thickness-normal) solid var(--black);
		height        : var(--height-control);
		box-sizing    : border-box;
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		cursor        : pointer;
		border-radius : 999px;
	}

	.add:hover {
		background : var(--hover);
	}
</style>
