<script lang='ts'>
	import { g, x, g_graph_tree, signals, S_Component } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Signal, T_Hit_Target } from '../../ts/common/Global_Imports';
	import Tree_Branches from './Tree_Branches.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount } from 'svelte';
	const { w_depth_limit, w_scale_factor, w_rect_ofGraphView, w_user_graph_offset } = g;
	const { w_ancestry_focus } = x;
	let s_component: S_Component;
	let reattachments = 0;

	s_component = signals.handle_anySignal_atPriority(3, $w_ancestry_focus, T_Hit_Target.tree, (t_signal, value): S_Component | null => {
		reattachments++;
	});

	onMount(() => { return () => s_component.disconnect(); });

</script>

{#key reattachments}
	{#if g_graph_tree.reset_scanOf_attached_branches() && !!$w_ancestry_focus}
		<div class = 'tree-graph'
			style = '
				position: absolute;
				z-index: {T_Layer.graph};
				transform: scale({$w_scale_factor});
				top: {$w_user_graph_offset.y - 2}px;
				left: {$w_user_graph_offset.x + 16}px;
				width: {$w_rect_ofGraphView.size.width}px;
				height: {$w_rect_ofGraphView.size.height}px;'>
			<Widget g_widget = {$w_ancestry_focus.g_widget}/>
			{#if $w_ancestry_focus.shows_branches}
				<Tree_Branches ancestry = {$w_ancestry_focus} depth = {$w_depth_limit}/>
			{/if}
		</div>
	{/if}
{/key}