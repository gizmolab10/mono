<script lang='ts'>
	import { T_Layer, T_Orientation, G_Cluster_Pager } from '../../ts/common/Global_Imports';
	import { k, core, u, x, colors, Angle, Point } from '../../ts/common/Global_Imports';
	export let font_size = `${k.font_size.cluster_slider}px`;
	export let background_color = $w_background_color;
	export let font_family = $w_thing_fontFamily;
	export let g_cluster_pager: G_Cluster_Pager;
	export let center_ofArc = Point.zero;
	export let zindex = T_Layer.text;
	export let text = k.space;
	export let color = 'red';
	export let radius = 0;
	export let angle = 0;
	const { w_thing_fontFamily } = x;
	const { w_background_color } = colors;
	const text_path_id = `arc-path-${Math.random().toString(36).substr(2, 9)}`;	

	$: arcLength = u.getWidth_ofString_withSize(text, font_size) * 1.3;
	$: ({ text_path_d } = g_cluster_pager.layout_endpoints_onArc(radius, angle, arcLength));

</script>

<svg class='text-on-arc'
	style='
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		overflow: visible;
		z-index: {zindex};
		position: absolute;
		pointer-events: none;'>
	<path id={text_path_id} d={text_path_d} fill='none' />
	<text
		fill={color}
		text-anchor='middle'
		font-size={font_size}
		font-family={font_family}
		dominant-baseline='middle'>
		<textPath href='#{text_path_id}' startOffset='50%'>
			<tspan style='background-color: {background_color};'>
				{text}
			</tspan>
		</textPath>
	</text>
</svg>

<style>
	.text-on-arc {
		overflow: visible;
	}
</style>
