<script lang='ts'>
	import { e, g, h, k, core, u, x, hits, show, Rect, Point, builds, debug, signals, elements } from '../../ts/common/Global_Imports';
	import { S_Component, T_Layer, T_Graph, T_Signal, T_Startup, T_Control } from '../../ts/common/Global_Imports';
	import Radial_Graph from '../radial/Radial_Graph.svelte';
	import Rubberband from '../mouse/Rubberband.svelte';
	import Tree_Graph from '../tree/Tree_Graph.svelte';
	import Button from '../mouse/Button.svelte';
	import { onMount } from 'svelte';
	const { w_t_graph } = show;
	const { w_t_startup } = core;
	const size_big = k.height.button + 4;
	const { w_s_hover, w_dragging } = hits;
	const { w_items: w_expanded } = x.si_expanded;
	const { w_rotate_angle, w_resize_radius } = hits;
	const { w_s_title_edit, w_ancestry_focus, w_thing_fontFamily } = x;
	const { w_depth_limit, w_user_graph_offset, w_rect_ofGraphView } = g;
	let actual_content_rect = g.user_offset_toGraphDrawing;
	let draggableRect = $w_rect_ofGraphView;
	let reattachments = 0;
	let style = k.empty;
	let draggable;

	//////////////////////////////////////////////
	//											//
	//	reattaches components on/changes to:	//
	//											//
	//		signal_rebuildGraph					//
	//		w_ancestry_focus					//
	//											//
	//	SHOULD only reposition for:				//
	//											//
	//		w_user_graph_offset					//
	//		w_rect_ofGraphView						//
	//											//
	//////////////////////////////////////////////
	
	onMount(() => {
		update_style();
	});
	
	$:	{
		const _ = `${$w_rect_ofGraphView.description}
			:::${$w_s_hover?.id ?? 'null'}
			:::${$w_t_graph}
			:::${$w_t_startup}`;
		update_style();
	}

	$:	{
		const _ = `${u.descriptionBy_titles($w_expanded)}
		:::${$w_ancestry_focus?.titles.join(k.comma)}
		:::${$w_t_graph}`;
		grand_layout_andReattach();
	}

	$: {
		const _ = `${$w_user_graph_offset.description}
		:::${$w_rect_ofGraphView.description}
		:::${$w_s_title_edit?.t_edit}
		:::${$w_resize_radius}
		:::${$w_rotate_angle}
		:::${$w_depth_limit}`;
		actual_content_rect = g.user_offset_toGraphDrawing;
	}

	function grand_layout_andReattach() {
		if (!!h && h.hasRoot) {
			g.layout();
			debug.log_draw(`GRAPH grand_layout_andReattach`);
			actual_content_rect = g.user_offset_toGraphDrawing;
			reattachments += 1;
		}
	}
		
	function update_style() {
		draggableRect = $w_rect_ofGraphView;
		const root = document.documentElement;
		root.style.setProperty('--graph-x', `${draggableRect.origin.x}px`);
		root.style.setProperty('--graph-y', `${draggableRect.origin.y}px`);
		style=`
			overflow: hidden;
			touch-action: none;
			position: absolute;
			pointer-events: auto;
			z-index: ${T_Layer.graph};
			width: ${draggableRect.size.width}px;
			height: ${draggableRect.size.height}px;
		`.removeWhiteSpace();
	}	

</script>

{#key reattachments}
	{#if $w_t_startup == T_Startup.ready}
		<div class='draggable'
			style={style}
			bind:this={draggable}
			class:rubberband-active={$w_dragging}>
			{#if $w_t_graph == T_Graph.radial}
				<Radial_Graph/>
			{:else}
				<Tree_Graph/>
			{/if}
			{#if debug.graph}
				<div class='debug-graph-content'
					style='
						position: absolute;
						border: 1px dashed green;
						z-index: ${T_Layer.frontmost};
						background-color: transparent;
						top: {actual_content_rect.origin.y - 1}px;
						left: {actual_content_rect.origin.x + 14}px;
						width: {actual_content_rect.size.width - 10}px;
						height: {actual_content_rect.size.height - 2}px;
					'>
				</div>
			{/if}
			<Rubberband
				bounds={draggableRect}
				strokeWidth={k.thickness.rubberband}
			/>
		</div>
		<div class='bottom-controls'
			style='
				position:absolute;
				top:{draggableRect.size.height - 26}px;'>
			<Button name={T_Control.builds}
				width={85}
				height={size_big}
				origin={Point.x(4)}
				s_button={elements.s_control_forType(T_Control.builds)}
				handle_s_mouse={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.builds)}>
				<span style='font-family: {$w_thing_fontFamily};'>
					{'build ' + builds.build_number}
				</span>
			</Button>
			<Button name={T_Control.help}
				width={size_big}
				height={size_big}
				origin={Point.x(draggableRect.size.width - 26)}
				s_button={elements.s_control_forType(T_Control.help)}
				handle_s_mouse={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.help)}>
				<span
					style='
						top:2px;
						left:6.5px;
						position:absolute;'>
					?
				</span>
			</Button>
		</div>
	{/if}
{/key}

<style>

	:global(body.rubberband-active) {
		cursor: crosshair !important;
		user-select: none !important;
		-ms-user-select: none !important;
		-moz-user-select: none !important;
		-webkit-user-select: none !important;
	}
</style>
