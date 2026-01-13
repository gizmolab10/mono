<script lang='ts'>
	import { Point, G_TreeLine, T_Layer, S_Component, T_Hit_Target } from '../../ts/common/Global_Imports';
	import { k, debug, colors, signals } from '../../ts/common/Global_Imports';
	import Circle from '../draw/Circle.svelte';
	import Box from '../debug/Box.svelte';
	import { onMount } from 'svelte';
	export let g_line!: G_TreeLine;
	const t_curve = g_line.t_curve;
	const { w_thing_color } = colors;
	const ancestry = g_line.branchAncestry;
	const debugOffset = new Point(k.height.line - 3.4, 2.5);
	let stroke_color = ancestry?.thing?.color;
	let s_component: S_Component;
	let svg_dasharray = k.empty;
	let reattachments = 0;

	//////////////////////////////
	//	draw a curved line		//
	//		in g_line.rect		//
	//		up, down or flat 	//
	//		solid or dashed 	//
	//////////////////////////////
 
	function isHit(): boolean { return false }

	s_component = signals.handle_reposition_widgets_atPriority(2, ancestry, T_Hit_Target.line, (received_ancestry) => {
		reattachments += 1;
	});

	onMount(() => { return () => s_component.disconnect(); });

	$: {
		if (!!ancestry && !!ancestry.thing && ancestry.thing.id == $w_thing_color?.split(k.separator.generic)[0]) {
			reattachments += 1;
		}
	}

	if (g_line.isBidirectional) {
		stroke_color = colors.opacitize(ancestry.thing.color, 0.7);
		svg_dasharray = k.dasharray.relateds;
	}

</script>

{#key reattachments}
	{#if !!ancestry}
		<svg
			id = {s_component.id}
			class = 'tree-line-svg'
			style = '
				top: {g_line.origin.y - g_line.size.height - 0.5 - g_line.stroke_width / 2}px;
				left: {g_line.origin.x + 136 + g_line.stroke_width / 2}px;
				height: {g_line.size.height + g_line.stroke_width * 2}px;
				width: {g_line.size.width + g_line.stroke_width * 2}px;
				z-index: {T_Layer.line};
				position: absolute;'>
			<path
				fill = 'none'
				d = {g_line.linePath}
				stroke = {stroke_color}
				class = 'tree-line-path'
				stroke-dasharray = {svg_dasharray}
				stroke-width = {g_line.stroke_width}/>
		</svg>
		{#if debug.lines}
			<Circle
				radius = 1
				thickness = 1
				color = black
				center = {g_line.rect.extent.offsetBy(debugOffset)}/>
		{/if}
	{/if}
{/key}
