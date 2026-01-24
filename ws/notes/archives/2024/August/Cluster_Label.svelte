<script lang='ts'>
	import { run } from 'svelte/legacy';

	import { k, u, Rect, Size, Point, Angle } from '../../ts/common/Global_Imports';
	import { Cluster_Map, Orientation } from '../../ts/common/Global_Imports';
	interface Props {
		cluster_map: Cluster_Map;
		color?: any;
		center?: any;
	}

	let { cluster_map, color = k.color_default, center = Point.zero }: Props = $props();
	let label_origin = $state(Point.zero);
	let label_title = $state(k.empty);


	function label_origin_for(rect: Rect): Point {
		let origin = Point.zero;
		if (!!cluster_map) {
			label_title = cluster_map.cluster_title ?? 'not named';
			const lines = label_title.split('<br>');
			const y = k.dot_size * -4.5;
			const x = u.getWidthOf(lines[0]) * -0.5;
			origin = rect.center.offsetByXY(x, y);
		}
		return origin;
	}

	// given label_angle & center, draw a label

	run(() => {
		if (!!cluster_map) {
			const origin = cluster_map.label_tip;
			const size = origin.abs.asSize.dividedInHalf;
			const label_rect = new Rect(center.offsetBy(origin), size);
			label_origin = label_origin_for(label_rect);
		}
	});
</script>

<div class='cluster-label'
	style='
		background-color: {k.color_background};
		left: {label_origin.x}px;
		top: {label_origin.y}px;
		white-space: nowrap;
		text-align: center;
		position: absolute;
		font-family: Arial;
		font-size: 0.5em;
		color: {color};'>
	{@html label_title}
</div>