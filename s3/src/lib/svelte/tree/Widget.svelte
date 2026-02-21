<script lang='ts'>
	import type { Ancestry } from '../../nav/Ancestry';
	import { G_Widget }      from '../../geometry/G_Widget';
	import type { Point }    from '../../types/Coordinates';
	import { colors }        from '../../colors/Colors.svelte';
	import Widget_Title      from './Widget_Title.svelte';

	let { ancestry, center }: {
		ancestry: Ancestry;
		center  : Point;
	} = $props();

	const g_widget = $derived(new G_Widget(center));
</script>

<div
	class      = 'widget'
	style:left = '{g_widget.origin.x}px'
	style:top  = '{g_widget.origin.y}px'
	style:width  = '{g_widget.width}px'
	style:height = '{g_widget.height}px'
	style:color  = {colors.thing}>
	<Widget_Title title={ancestry.thing?.title ?? ''} />
</div>

<style>
	.widget {
		position    : absolute;
		display     : flex;
		align-items : center;
		font-size   : 14px;
		cursor      : default;
	}
</style>
