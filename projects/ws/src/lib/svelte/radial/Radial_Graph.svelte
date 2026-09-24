<script lang='ts'>
	import { T_Layer, T_Signal, T_Radial_Zone, T_Hit_Target, S_Component } from '../../ts/common/Global_Imports';
	import { g, k, core, u, x, radial, signals, elements, g_graph_radial } from '../../ts/common/Global_Imports';
	import Radial_Rings from './Radial_Rings.svelte';
	import Radial_Focus from './Radial_Focus.svelte';
	import Widget from '../widget/Widget.svelte';
	import { onMount } from 'svelte';
	const { w_g_paging } = radial;
	const { w_ancestry_focus } = x;
	const { w_rect_ofGraphView, w_user_graph_offset } = g;
	let s_component: S_Component;
	let reattachments = 0;

	//////////////////////////////////////////////
	//											//
	//	reattaches components on/changes to:	//
	//											//
	//		rebuild_needed_forType radial		//
	//		handle_reattach_widgets				//
	//		w_ancestry_focus					//
	//											//
	//	SHOULD only reposition for:				//
	//											//
	//		w_user_graph_offset					//
	//		w_rect_ofGraphView						//
	//											//
	//////////////////////////////////////////////

	// draw center title, arcs, radial and widget necklace
	//	also selection & hover for arcs & radial

	// needs:
	//	handle keys
	//	edit titles (keydown terminates edit) BROKEN
	//	displays editing go when asked by user
	
	g.layout();

	s_component = signals.handle_signals_atPriority([T_Signal.reattach], 0, null, T_Hit_Target.radial, (ancestry) => {
		reattachments += 1;
	});

	signals.handle_signals_atPriority([T_Signal.reposition], 2, null, T_Hit_Target.radial, (received_ancestry) => {
		reattachments += 1;
	});

	onMount(() => { return () => s_component.disconnect(); });

	$: {
		const g_paging = $w_g_paging;
		if (!!g_paging && !!$w_ancestry_focus.thing && $w_ancestry_focus.thing.id == g_paging.thing_id) {
			reattachments += 1;
		}
	}

</script>

<div class = 'radial-graph'
	id = {s_component.id}
	style = '
		position: absolute;
		z-index : {T_Layer.graph};
		width : {$w_rect_ofGraphView.size.width}px;
		height : {$w_rect_ofGraphView.size.height}px;
		transform : translate({$w_user_graph_offset.x}px, {$w_user_graph_offset.y}px);'>
	<Radial_Rings/>
	{#key reattachments}
		<Widget g_widget={$w_ancestry_focus.g_widget}/>
		<div class = 'necklace-of-widgets'
			style = 'z-index : {T_Layer.necklace};'>
			{#each g_graph_radial.g_necklace_widgets as g_necklace_widget}
				<Widget g_widget = {g_necklace_widget}/>
			{/each}
		</div>
	{/key}
</div>
