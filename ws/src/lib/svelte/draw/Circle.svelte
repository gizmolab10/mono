<script lang='ts'>
	import { k, u, Point, debug, T_Layer } from '../../ts/common/Global_Imports'
	export let zindex = T_Layer.dot;
	export let center = Point.zero;
	export let name = k.empty;
	export let thickness = 1;
	export let radius = 2;
	export let color;
	let diameter = 0;

	$: diameter = radius * 2;

</script>

<div
	class= 'circle' name={name} style='
		z-index: {zindex};
		position: absolute;
		border-radius: 50%;
		width: {diameter}px;
		height: {diameter}px;
		border: {thickness}px solid {color};
		top: {center.y - radius - thickness}px;
		left: {center.x - radius - thickness}px;'>
</div>
