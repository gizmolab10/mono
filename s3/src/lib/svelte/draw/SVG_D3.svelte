<script lang='ts'>
	let { svgPath, fill, stroke, stroke_width, width, height, position, name }: {
		svgPath      : string;
		fill         : string;
		stroke       : string;
		stroke_width : number;
		width        : number;
		height       : number;
		position     : string;
		name         : string;
	} = $props();
</script>

<svg
	class              = 'svg-d3 {name}'
	{width}
	{height}
	viewBox            = '0 0 {width} {height}'
	style:position     = {position}
	preserveAspectRatio = 'none'
	shape-rendering     = 'geometricPrecision'>
	<path d={svgPath} {fill} {stroke} stroke-width={stroke_width} />
</svg>
