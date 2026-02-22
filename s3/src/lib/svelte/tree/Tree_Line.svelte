<script lang='ts'>
	import { colors }      from '../../colors/Colors.svelte';
	import type { G_TreeLine } from '../../geometry/G_TreeLine';

	let { line }: { line: G_TreeLine } = $props();
</script>

<svg
	class  = 'tree-line'
	style:left   = '{line.svg_origin.x}px'
	style:top    = '{line.svg_origin.y}px'
	width  = '{line.svg_size.width + 2}'
	height = '{line.svg_size.height + 2}'>
	<path
		d              = {line.linePath}
		fill           = 'none'
		stroke         = {colors.thing}
		stroke-width   = '1'
		stroke-opacity = '1' />
</svg>

<style>
	.tree-line {
		position : absolute;
		overflow : visible;
	}
</style>
