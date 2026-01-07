<script lang='ts'>
	import { Point } from '../../ts/types/Coordinates';
	import Angle, { Direction } from '../../ts/types/Angle';

	let {
		radius    = 6,
		thickness = 1,
		color     = 'black',
		center    = Point.zero,
		direction = Direction.right
	} : {
		radius?    : number;
		thickness? : number;
		color?     : string;
		center?    : Point;
		direction? : Direction;
	} = $props();

	// Compute arc endpoints based on direction
	let baseAngle     = $derived(direction + Angle.half);
	let leftEndAngle  = $derived(baseAngle + Angle.quarter);
	let rightEndAngle = $derived(baseAngle - Angle.quarter);

	let aStart = $derived(Point.fromPolar(radius, leftEndAngle));
	let aEnd   = $derived(Point.fromPolar(radius, baseAngle));
	let bEnd   = $derived(Point.fromPolar(radius, rightEndAngle));

	// Compute SVG viewBox bounds
	let minX   = $derived(Math.min(aStart.x, aEnd.x, bEnd.x));
	let maxX   = $derived(Math.max(aStart.x, aEnd.x, bEnd.x));
	let minY   = $derived(Math.min(aStart.y, aEnd.y, bEnd.y));
	let maxY   = $derived(Math.max(aStart.y, aEnd.y, bEnd.y));
	let width  = $derived(maxX - minX);
	let height = $derived(maxY - minY);

	// Position
	let svgTop  = $derived(center.y + minY);
	let svgLeft = $derived(center.x + minX);

	// Build SVG path: two quarter arcs
	let path = $derived(
		`M ${aStart.x} ${aStart.y} ` +
		`A ${radius} ${radius} 0 0 0 ${aEnd.x} ${aEnd.y} ` +
		`A ${radius} ${radius} 0 0 0 ${bEnd.x} ${bEnd.y}`
	);
</script>

<svg
	class      = 'gull-wings'
	{width}
	{height}
	style:top  = '{svgTop}px'
	style:left = '{svgLeft}px'
	viewBox    = '{minX} {minY} {width} {height}'>
	<path
		d            = {path}
		fill         = {color}
		stroke       = {color}
		stroke-width = {thickness}
	/>
</svg>

<style>
	.gull-wings {
		position       : absolute;
		pointer-events : none;
	}
</style>
