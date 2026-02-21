<script lang='ts'>
	import { rootAncestry } from '../../nav/Ancestry';
	import { Point }        from '../../types/Coordinates';
	import Tree_Branches    from './Tree_Branches.svelte';
	import Widget           from './Widget.svelte';

	const focusCenter = new Point(150, 200);
	const depth       = 3;
</script>

<div class='tree-graph'>
	<Widget ancestry={rootAncestry} center={focusCenter} />
	<Tree_Branches ancestry={rootAncestry} parentCenter={focusCenter} {depth} />
</div>

<style>
	.tree-graph {
		position : relative;
		width    : 100%;
		height   : 100%;
	}
</style>
