<script lang='ts'>
	import type { T_Match } from '../../ts/managers/Filter_Documents';
	import { w_hierarchy } from '../../ts/database/Databases';
	import { w_db_changed } from '../../ts/types/Signal';
	import { debug } from '../../ts/common/Debug';
	import type { Snippet } from 'svelte';

	// Pick one or more tags. Shows every tag in the active store as a chip;
	// clicking toggles it. The chosen tag ids are shared with the parent (the add
	// flow tags a drop, search filters). Live off the store-changed tick.

	// `selected` is the chosen set (the add flow binds it). `mode` is the all/any
	// match; a caller that binds it gets the toggle shown beside the chips (the
	// filter does), one that omits it (the per-row edit picker) gets no toggle.
	// `ontoggle` lets a caller react to each click directly — documents uses it to
	// add/remove a tag right away. `trailing` renders after the last chip, same row.
	let { selected = $bindable(new Set<string>()), mode = $bindable<T_Match | undefined>(undefined), ontoggle, trailing }:
		{ selected?: Set<string>; mode?: T_Match; ontoggle?: (id: string, on: boolean) => void; trailing?: Snippet } = $props();

	// Copy the list so each change yields a new array — the store mutates its list
	// in place, and a same-reference return would be seen as unchanged (no redraw).
	const tags = $derived.by(() => {
		$w_db_changed;
		return [...$w_hierarchy.tags];
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
</script>

<div class='picker'>
	{#if mode !== undefined && tags.length >= 2}
		<!-- The any/all toggle sits right beside the chips; only shown to a caller
		     that binds the match mode (the filter), and only with two or more tags —
		     with one tag or none, all vs any makes no difference. -->
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
		color      : var(--text-on-accent);
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
		color      : var(--text-on-accent);
	}

	.chip:not(.on):hover {
		background : var(--hover);
	}
</style>
