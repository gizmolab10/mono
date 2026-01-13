<script lang='ts'>
	import { k, s, Point, ZIndex, onMount } from '../../ts/common/GlobalImports';
	import Mouse_Responder from '../mouse buttons/Mouse_Responder.svelte';
	interface Props {
		cluster_map: Cluster_Map;
		size?: any;
		color?: string;
	}

	let { cluster_map, size = k.dot_size, color = 'red' }: Props = $props();
	const element_state = cluster_map.thumb_state;		// survives onDestroy, created by cluster arc map
	const name = element_state.name;
	let center = $state(Point.zero);
	let cluster_thumb = $state();

	onMount(() => {
		center = cluster_map.thumb_center.offsetBy(cluster_map.origin);
	});

	function closure() {}

</script>

<Mouse_Responder
	width={size}
	height={size}
	center={center}
	closure={closure}
	name={element_state.name}>
	<button class='dot'
		bind:this={cluster_thumb}
		id={'button-for-' + name}
		style='
			border:none;
			cursor:pointer;
			width:{size}px;
			height:{size}px;
			color:transparent;
			position:absolute;
			z-index:{ZIndex.dots};
			background-color:transparent;'>
		<svg>
			<path stroke={color} fill={k.color_background} d={cluster_map.thumb_svgPath}/>
		</svg>
</Mouse_Responder>
