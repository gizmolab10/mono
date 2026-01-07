<script lang='ts'>
	import { Point } from '../../ts/types/Coordinates';
	import { Direction } from '../../ts/types/Angle';
	import { svg_paths } from '../../ts/draw/SVG_Paths';

	let {
		radius    = 6,
		color     = 'black',
		center    = Point.zero,
		direction = Direction.right
	} : {
		radius?    : number;
		color?     : string;
		center?    : Point;
		direction? : Direction;
	} = $props();

	// Get path and bounds from svg_paths
	let path   = $derived(svg_paths.gull_wings(Point.zero, radius, direction));
	let bounds = $derived(svg_paths.gull_wings_bounds(radius, direction));

	// Position SVG relative to center
	let svgTop  = $derived(center.y + bounds.minY);
	let svgLeft = $derived(center.x + bounds.minX);
</script>

<svg
	class      = 'gull-wings'
	width      = {bounds.width}
	height     = {bounds.height}
	style:top  = '{svgTop}px'
	style:left = '{svgLeft}px'
	viewBox    = '{bounds.minX} {bounds.minY} {bounds.width} {bounds.height}'>
	<path
		d      = {path}
		fill   = {color}
		stroke = {color}
	/>
</svg>

<style>
	.gull-wings {
		z-index        : 10;
		position       : absolute;
		pointer-events : none;
	}
</style>
