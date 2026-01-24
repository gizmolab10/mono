<script lang='ts'>
	import { k, Arc_Map } from '../../ts/common/Global_Imports';
	interface Props {
		viewBox?: any;
		arc_map: Arc_Map;
		color?: string;
	}

	let { viewBox = k.empty, arc_map, color = 'red' }: Props = $props();

</script>

<svg class='svg-scroll-arc' viewBox={viewBox}>
	{#if arc_map.shown < 2}
		<path stroke={color} fill=transparent d={arc_map.single_svgPath}/>
	{:else}
		<path stroke={color} fill=transparent d={arc_map.arc_svgPath}/>
	{/if}
</svg>
