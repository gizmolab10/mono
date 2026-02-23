<script lang='ts'>
	import { Ancestry }     from '../../nav/Ancestry';
	import { g_treeGraph }  from '../../geometry/G_TreeGraph.svelte';
	import { ux }           from '../../state/ux.svelte';
	import Tree_Branches    from './Tree_Branches.svelte';
	import Widget           from './Widget.svelte';

	let graphElement: HTMLDivElement;

	const focus       = $derived(ux.ancestry_focus ?? Ancestry.root);
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
</script>

<div class='tree-graph' bind:this={graphElement}>
	<div
		class            = 'tree-content'
		style:transform  = 'scale({ux.scale}) translate({ux.user_graph_offset.x}px, {ux.user_graph_offset.y}px)'
		style:transform-origin = 'center center'>
		{#if g_treeGraph.graph_width > 0}
			<Widget ancestry={focus} center={focusCenter} />
			<Tree_Branches ancestry={focus} parentCenter={focusCenter} {depth} />
		{/if}
	</div>
</div>

<style>
	.tree-graph {
		position : relative;
		width    : 100%;
		height   : 100%;
		overflow : hidden;
	}

	.tree-content {
		position : relative;
		width    : 100%;
		height   : 100%;
	}
</style>
