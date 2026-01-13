<script lang='ts'>
	import { k, Size, Point, ZIndex, svgPaths, Direction } from '../../ts/common/Global_Imports';
	import SVGD3 from './SVGD3.svelte';
	export let extraColor = k.color_background;
	export let extraPath = null;
	export let strokeColor;
	export let fillColor;
	export let position;
	export let size;
	const trianglePath = svgPaths.fat_polygon(size, Direction.left);

</script>

<SVGD3 name='fatTriangle'
	width={size}
	height={size}
	fill={fillColor}
	position={position}
	stroke={strokeColor}
	svgPath={trianglePath}
/>
{#if extraPath}
	<SVGD3 name='fatTriangleInside'
		width={size}
		height={size}
		fill={extraColor}
		stroke={extraColor}
		svgPath={extraPath}
		x={size / 4}
	/>
{/if}