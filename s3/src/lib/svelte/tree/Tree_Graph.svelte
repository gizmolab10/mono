<script lang='ts'>
	import { rootAncestry } from '../../nav/Ancestry';
	import { g_treeGraph }  from '../../geometry/G_TreeGraph';
	import { ux }           from '../../state/ux.svelte';
	import Tree_Branches    from './Tree_Branches.svelte';
	import Widget           from './Widget.svelte';

	let graphElement: HTMLDivElement;

	const focus       = $derived(ux.ancestry_focus ?? rootAncestry);
	const depth       = $derived(ux.global_depth_limit);
	const focusCenter = $derived(g_treeGraph.focus_center);

	$effect(() => {
		if (!graphElement) return;
		const observer = new ResizeObserver(([entry]) => {
			g_treeGraph.update_size(entry.contentRect.width, entry.contentRect.height);
		});
		observer.observe(graphElement);
		return () => observer.disconnect();
	});

	$effect(() => {
		void focus;
		void depth;
		g_treeGraph.reset_attached_branches();
	});
</script>

<div class='tree-graph' bind:this={graphElement}>
	{#if g_treeGraph.graph_width > 0}
		<Widget ancestry={focus} center={focusCenter} />
		<Tree_Branches ancestry={focus} parentCenter={focusCenter} {depth} />
	{/if}
</div>

<style>
	.tree-graph {
		position : relative;
		width    : 100%;
		height   : 100%;
	}
</style>
