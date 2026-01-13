<script lang='ts'>
	import { T_Layer, T_Graph, T_Focus, T_Control, T_Kinship } from '../../ts/common/Global_Imports';
	import { e, g, k, u, show, Point, colors, controls } from '../../ts/common/Global_Imports';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../draw/Separator.svelte';
	import Slider from '../mouse/Slider.svelte';
	import { transparentize } from 'color2k';
	export let zindex = T_Layer.graph;
	const { w_depth_limit } = g;
	const heights = [ 3, 5, 18 ];
	const { w_separator_color } = colors;
	const { w_t_trees, w_t_focus } = show;
	const tops = u.cumulativeSum(heights);
	const segmented_height = k.height.button + 2;
	let widths: Array<number> = [];
	let lefts: Array<number> = [];

	function layout_controls() {
		widths = {
			0: 10,		// initial offset (for tree types start position)
			1: 122,		// tree types segmented control width
			2: 22,		// separator width
			3: 94,		// focus-response-type segmented control width
			4: 117,		// slider width
			5: 42,		// depth value width
		};
		lefts = u.cumulativeSum(Object.values(widths));
	}

	function handle_depth_limit(value: number) {
		const asInteger = Math.round(value);
		if (asInteger !== $w_depth_limit) {
			$w_depth_limit = asInteger;  // Store the integer, not the raw value
			e.throttle('tree_layout', 50, () => g.layout());
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
	pointer-events: auto;
	background-color: transparent;'>
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
	<Segmented name='focus-response-type'
		width={50}
		allow_multiple={false}
		selected={[$w_t_focus]}
		height={segmented_height}
		origin={new Point(lefts[2], 5)}
		titles={[T_Focus.static, T_Focus.dynamic]}
		handle_selection={(titles) => controls.handle_segmented_choices('focus', titles)}/>
	<Slider
		max={12}
		width={117}
		show_value={false}
		isLogarithmic={true}
		value={$w_depth_limit}
		height={k.height.button + 4}
		origin={new Point(lefts[3], 3)}
		thumb_color={$w_separator_color}
		title_font_size={k.font_size.banners}
		handle_value_change={handle_depth_limit}/>
	<div class='depth-value' style='
		top: 2px;
		width: 56px;
		height: 26px;
		display: flex;
		left: {lefts[4]}px;
		position: absolute;
		align-items: center;
		justify-content: center;
		font-size: {k.font_size.common}px;'>
		{$w_depth_limit} level{($w_depth_limit < 2) ? '' : 's'}
	</div>
</div>