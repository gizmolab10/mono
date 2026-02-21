<script lang='ts'>
	import type { Ancestry }    from '../../nav/Ancestry';
	import { G_TreeBranches }   from '../../geometry/G_TreeBranches';
	import type { Point }       from '../../types/Coordinates';
	import Widget               from './Widget.svelte';
	import Tree_Branches        from './Tree_Branches.svelte';

	let { ancestry, parentCenter, depth }: {
		ancestry    : Ancestry;
		parentCenter: Point;
		depth       : number;
	} = $props();

	const g_branches  = $derived(new G_TreeBranches(ancestry, parentCenter, depth));
	const branchItems = $derived(g_branches.branchItems);
</script>

{#if depth > 0}
	{#each branchItems as { branch, center }}
		<Widget ancestry={branch} {center} />
		<Tree_Branches ancestry={branch} parentCenter={center} depth={depth - 1} />
	{/each}
{/if}
