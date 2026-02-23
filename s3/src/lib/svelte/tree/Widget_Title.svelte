<script lang='ts'>
	import { ux }            from '../../state/ux.svelte';
	import Text_Editor       from './Text_Editor.svelte';
	import type { Ancestry } from '../../nav/Ancestry';

	let { ancestry, left }: {
		ancestry: Ancestry;
		left:     number;
	} = $props();

	const title     = $derived(ancestry.thing?.title ?? '');
	const isEditing = $derived(ux.isEditing_ancestry(ancestry));
</script>

{#if isEditing}
	<Text_Editor {ancestry} {left} />
{:else}
	<span class='title' style:margin-left='{left}px'>{title}</span>
{/if}

<style>
	.title {
		white-space   : nowrap;
		overflow      : hidden;
		text-overflow : ellipsis;
	}
</style>
