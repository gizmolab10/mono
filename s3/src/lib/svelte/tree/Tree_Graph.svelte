<script lang='ts'>
	import { rootAncestry } from '../../nav/Ancestry';
	import { ux }           from '../../state/ux.svelte';
	import { Point }        from '../../types/Coordinates';
	import Tree_Branches    from './Tree_Branches.svelte';
	import Widget           from './Widget.svelte';

	const focusCenter = new Point(150, 200);
	const focus       = $derived(ux.ancestry_focus ?? rootAncestry);
	const depth       = $derived(ux.global_depth_limit);
</script>

<div class='tree-graph'>
	<Widget ancestry={focus} center={focusCenter} />
	<Tree_Branches ancestry={focus} parentCenter={focusCenter} {depth} />
</div>

<style>
	.tree-graph {
		position : relative;
		width    : 100%;
		height   : 100%;
	}
</style>
