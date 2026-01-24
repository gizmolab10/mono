<script lang='ts'>
	import { k, Point, Thing, ZIndex, signals, transparentize } from '../../ts/common/GlobalImports';
	import RingButton from '../buttons/RingButton.svelte';
	interface Props {
		center?: any;
		color?: any;
		thing: Thing;
	}

	let { center = Point.zero, color = k.empty, thing }: Props = $props();
</script>

<RingButton name='necklace-ring'
	thickness={30}
	color={color}
	thing={thing}
	center={center}
	zindex={ZIndex.lines}
	radius={k.cluster_arc_radius}/>
	