<script lang='ts'>
	import type { Point } from '../../types/Coordinates';

	let { color, center }: {
		color  : string;
		center : Point;
	} = $props();

	const rx     = 4;
	const ry     = 5.5;
	const width  = rx * 2;
	const height = ry * 2;
</script>

<div
	class  = 'drag'
	style:left = '{center.x - rx}px'
	style:top  = '{center.y - ry - 3}px'>
	<svg
		width  = {width}
		height = {height}
		viewBox = '0 0 {width} {height}'>
		<ellipse cx={rx} cy={ry} {rx} {ry} fill='white' stroke={color} stroke-width='1' />
	</svg>
</div>

<style>
	.drag {
		position : absolute;
	}
</style>
