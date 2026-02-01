<script lang='ts'>
	import { e, g, k, u, x, show, Point, colors, controls } from '../../ts/common/Global_Imports';
	import { T_Graph, T_Layer, T_Control, T_Kinship } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../draw/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import { transparentize } from 'color2k';
	export let zindex = T_Layer.graph;
	const { w_t_trees } = show;
	const { w_depth_limit } = g;
	const heights = [ 3, 5, 18 ];
	const { w_separator_color } = colors;
	const tops = u.cumulativeSum(heights);
	const segmented_height = k.height.button + 2;
	let widths: Array<number> = [];
	let lefts: Array<number> = [];

	function layout_controls() {
		widths = {
			0: 10,		// initial offset (for tree types start position)
			1: 122,		// tree types segmented control width
			2: 6,		// separator width
			3: 117,		// slider width
			4: 42,		// depth value width
		};
		lefts = u.cumulativeSum(Object.values(widths));
	}

	function handle_depth_limit(value: number) {
		const rounded = Math.round(value);
		if (rounded !== $w_depth_limit) {
			$w_depth_limit = rounded;		// store the rounded value [an actual integer], not the raw value
			x.assure_grab_isVisible();
		}
	}

	layout_controls();

</script>

<div class='tree-preferences' style='
	top: 3px;
	left: -3px;
	width: 100%;
	height: 35px;
	z-index: {zindex};
	position: absolute;
	border-radius: 20px;
	pointer-events: auto;'>
	{#key $w_t_trees}
		<Segmented name='tree-types'
			left={58}
			width={widths[1]}
			allow_multiple={true}
			selected={$w_t_trees}
			height={k.height.button + 2}
			origin={new Point(lefts[0], 5)}
			titles={[T_Kinship.children, T_Kinship.related]}
			handle_selection={(titles) => controls.handle_segmented_choices('tree', titles)}/>
	{/key}
	<Separator name='tree-types-separator'
		isHorizontal={false}
		length={segmented_height + 19}
		origin={new Point(lefts[1], -0.5)}
		thickness={k.thickness.separator.main}
		corner_radius={k.radius.fillets.thick}/>
	<Slider
		max={12}
		width={117}
		name='depth-limit'
		show_value={false}
		isLogarithmic={true}
		value={$w_depth_limit}
		height={k.height.button + 4}
		origin={new Point(lefts[2], 3)}
		thumb_color={$w_separator_color}
		title_font_size={k.font_size.banners}
		handle_value_change={handle_depth_limit}/>
	<div class='depth-value' style='
		top: 2px;
		width: 56px;
		height: 26px;
		display: flex;
		left: {lefts[3]}px;
		position: absolute;
		align-items: center;
		justify-content: center;
		font-size: {k.font_size.common}px;'>
		{$w_depth_limit} level{($w_depth_limit < 2) ? '' : 's'}
	</div>
</div>