<script lang=ts>
	import { show, debug, g_graph_tree, signals, Ancestry } from '../../ts/common/Global_Imports';
	import { S_Component, T_Signal, T_Hit_Target } from '../../ts/common/Global_Imports';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	import Tree_Line from './Tree_Line.svelte';
	import Circle from '../draw/Circle.svelte';
	import { onMount } from 'svelte';
	export let ancestry: Ancestry;
	export let depth: number;
	const { w_show_related } = show;
	const g_widget = ancestry.g_widget;
	const g_childBranches = g_widget.g_childBranches;
	let s_component: S_Component;
	let reattachments = 0;

	debug.log_draw(`TREE_BRANCHES ${ancestry?.titles}`);

	s_component = signals.handle_anySignal_atPriority(2, ancestry, T_Hit_Target.branches, (t_signal, value): S_Component | null => {
		reattachments++;
	});

	onMount(() => { return () => s_component.disconnect(); });

</script>

{#if depth > 0}
	{#if debug.lines}
		<Circle
			radius = 1
			thickness = 1
			color = black
			center = {g_childBranches.origin_ofLine}/>
	{/if}
	{#key reattachments}
		{#if !!ancestry}
			{#each ancestry.branchAncestries as branchAncestry}
				<Tree_Line g_line = {branchAncestry.g_widget.g_line}/>
				<Widget g_widget = {branchAncestry.g_widget}/>
				{#if branchAncestry.shows_branches && !g_graph_tree.branch_isAlready_attached(branchAncestry)}
					<Tree_Branches ancestry = {branchAncestry} depth = {depth - 1}/>
				{/if}
			{/each}
			{#if $w_show_related && depth > 1}
				{#each g_widget.g_bidirectionalLines as g_line}
					{#if g_line.depth_ofLine < (depth + 2)}
						<Tree_Line g_line = {g_line}/>
					{/if}
				{/each}
			{/if}
		{/if}
	{/key}
{/if}
