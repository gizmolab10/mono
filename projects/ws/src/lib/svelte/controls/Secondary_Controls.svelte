<script lang='ts'>
	import { Point, T_Layer, T_Graph } from '../../ts/common/Global_Imports';
	import { g, k, show, features } from '../../ts/common/Global_Imports';
	import Tree_Controls from './Tree_Controls.svelte';
	import Separator from '../draw/Separator.svelte';
	import Search from '../search/Search.svelte';
	const { w_show_search_controls, w_t_graph } = show;
	const top = g.controls_boxHeight - 5;
	const height = g.controls_boxHeight;
	let isVisible = false;

	// two states: search and tree preferences

	$: {
		const _ = `${$w_show_search_controls}:::${$w_t_graph}`;
		isVisible = $w_show_search_controls || $w_t_graph == T_Graph.tree;
	}

</script>

{#if isVisible}
	<div class='secondary'
		style='
			left: 0px;
			top: {top}px;
			height: {height}px;
			position: absolute;
			z-index: {T_Layer.frontmost};
			width: {g.windowSize.width}px;'>
		{#if $w_show_search_controls}
			<Search top={8}/>
		{:else if $w_t_graph == T_Graph.tree}
			<Tree_Controls/>
		{/if}
		{#if features.allow_tree_mode}
			<Separator name='secondary-bottom-separator'
				corner_radius={k.radius.fillets.thick}
				thickness={k.thickness.separator.main}
				length={g.windowSize.width + 2.5}
				origin={new Point(2, top)}
				has_double_fillet={true}
				isHorizontal={true}/>
		{/if}
	</div>
{/if}

<style>
	.secondary {
		position: absolute;
		width: 100%;
		left: 0;
		top: 0;
	}
</style>
