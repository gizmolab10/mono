<script lang='ts'>
	// Pick one or more tags. Shows every tag in the active store as a chip;
	// clicking toggles it. The chosen tag ids are shared with the parent (the add
	// flow tags a drop, search filters). Live off the store-changed tick.
	import { databases } from '../../ts/database/Databases';
	import { w_db_changed } from '../../ts/database/Signal';

	// `selected` is the chosen set (the add flow binds it). `ontoggle` lets a caller
	// react to each click directly — browse uses it to add/remove a tag right away.
	let { selected = $bindable(new Set<string>()), ontoggle }:
		{ selected?: Set<string>; ontoggle?: (id: string, on: boolean) => void } = $props();

	const tags = $derived.by(() => {
		$w_db_changed;
		return databases.active.tags;
	});

	function toggle(id: string) {
		const on = !selected.has(id);
		const next = new Set(selected);
		if (on) { next.add(id); } else { next.delete(id); }
		selected = next;
		ontoggle?.(id, on);
		console.log(`Tag picker: ${next.size} of ${tags.length} tag(s) now chosen.`);
	}
</script>

<div class='tags'>
	{#each tags as tag}
		<button class='chip' class:on={selected.has(tag.id)} onclick={() => toggle(tag.id)}>{tag.name}</button>
	{/each}
</div>

<style>
	.tags {
		flex-wrap   : wrap;
		align-items : center;
		gap         : var(--gap-tight);
		display     : flex;
	}

	.chip {
		border        : var(--thickness-normal) solid var(--black);
		border-radius : 999px;
		padding       : var(--pad-control);
		font-size     : var(--font-label);
		background    : var(--white);
		color         : var(--text);
		cursor        : pointer;
	}

	.chip.on {
		background : var(--accent);
	}

	.chip:hover {
		background : var(--hover);
	}
</style>
