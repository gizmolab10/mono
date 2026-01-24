<script lang='ts'>
	import { k } from '../../ts/common/Constants';
	import { Point } from '../../ts/types/Coordinates';
	import { Direction } from '../../ts/types/Angle';
	import { svg_paths } from '../../ts/draw/SVG_Paths';

	let {
		radius    = k.radius.fillets.thick,
		thickness = k.thickness.separator.main,
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

	// Get path and bounds from svg_paths
	let path   = $derived(svg_paths.fillets(Point.zero, radius, direction));
	let bounds = $derived(svg_paths.fillets_bounds(radius, direction));

	// Expand bounds to account for stroke width (stroke extends half outside path)
	let padding = $derived(thickness / 2);
	let minX    = $derived(bounds.minX - padding);
	let minY    = $derived(bounds.minY - padding);
	let width   = $derived(bounds.width + thickness);
	let height  = $derived(bounds.height + thickness);

	// Position SVG relative to center
	let svgTop  = $derived(center.y + minY);
	let svgLeft = $derived(center.x + minX);
</script>

<svg
	class      = 'fillets'
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
	.fillets {
		z-index        : 10;
		position       : absolute;
		pointer-events : none;
	}
</style>
