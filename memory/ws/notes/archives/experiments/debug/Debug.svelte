<script lang='ts'>
	import { c, u, Rect, Size, Point, debug, T_Layer, layout } from '../../ts/common/Global_Imports';
	import { w_user_graph_center, w_s_alteration } from '../../ts/managers/Stores';
	import { w_graph_rect, w_mouse_location_scaled } from '../../ts/managers/Stores';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Box from './Box.svelte';
	export let size = 16;
	const multiplier = 0.6;
	let mouse_rect = Rect.zero;
	let base = new Point(-39, -28);
	let debug_origin = $w_user_graph_center?.offsetBy(base) ?? Point.zero;

	$: debug_origin = $w_user_graph_center?.offsetBy(base) ?? Point.zero;

	$: {
		const point = $w_mouse_location_scaled;
		if (!!point) {
			const square = Size.square(size);
			const origin = point.offsetBy(square.asPoint.negatedInHalf);
			mouse_rect = new Rect(origin, square);
		}
	}

	function hover_closure(s_mouse) {
		if (s_mouse.isMove) {
			const distance = layout.mouse_distance_fromGraphCenter;
			// debug.log_cursor(distance.toFixed(2));
			// mouse location
			// measure distance to debug_origin
			// when "close enough to zero"
			// store mouse location in debug_origin
			// redraw debug
		}
	}

</script>

{#if debug.graph}
	<Box
		cross = {true}
		name = 'graph'
		color = 'green'
		zindex = {T_Layer.common}
		rect = {$w_graph_rect}/>
{/if}
{#if debug.actions && !!$w_s_alteration}
	<Box
		name = 'actions'
		color = 'purple'
		zindex = {T_Layer.frontmost}
		rect = {$w_s_alteration.ancestry.titleRect}/>
{/if}
{#if debug.cursor}
	<Mouse_Responder
		name='debug-cursor'
		origin={Point.zero}
		zindex = {T_Layer.common}
		width={layout.windowSize.width}
		height={layout.windowSize.height}
		handle_s_mouse={hover_closure}>
		<Box
			color = 'red'
			cross = {true}
			name = 'cursor'
			rect = {mouse_rect}
			zindex = {T_Layer.common}/>
		{#if false}
			<Box
				cross = {true}
				color = 'blue'
				name = 'origin'
				zindex = {T_Layer.common}
				rect = {new Rect(debug_origin, Size.square(18))}/>
		{/if}
	</Mouse_Responder>
{/if}
