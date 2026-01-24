<script lang='ts'>
	import { k, u, Point, colors, T_Layer, Direction } from '../../ts/common/Global_Imports';
	import Clickable_Label from '../mouse/Clickable_Label.svelte';
	import Fillets from '../draw/Fillets.svelte';
	export let handle_mouseUp: (event: Event) => {} | null = null;
	export let corner_radius = k.radius.fillets.ultra_thin;
	export let title_font_size = k.font_size.separator;
	export let thickness = k.thickness.separator.main;
	export let title_left: number | null= null;
	export let title: string | null = null;
	export let zindex = T_Layer.details;
	export let length = k.width.details;
	export let has_thin_divider = false;
	export let has_fillets = true;
	export let has_double_fillet = true;
	export let position = 'absolute';
	export let origin = Point.zero;
	export let isHorizontal = true;
	export let name = 'separator';
	export let margin = 0;
	const { w_separator_color, w_background_color } = colors;
	const thin_line_color = colors.thin_separator_line_color;
	const line_left = isHorizontal ? origin.x + margin : origin.x - thickness / 2;
	const class_name = `${name}-line-${isHorizontal ? 'horizontal' : 'vertical'}`;
	const title_top = origin.y - 1 - title_font_size / 1.5 + (position == 'relative' ? 0 : 1);
	const title_width = u.getWidth_ofString_withSize(title ?? k.empty, `${title_font_size}px`);

	// origin			is the center at the start of the separator
	// isHorizontal		true -> starts at origin.x, false -> starts at top
	// has_fillets		has fillets at either one or both ends
	// has_both_fillets	if has_fillets is true, then has fillets at both ends
	// length			length of the separator
	// margin		
	// zindex
	// handle_mouseUp		renders as a clickable label instead

	$: separatorStyle = style_for(isHorizontal, line_left, zindex, top, origin.y, margin, thickness, length, $w_separator_color);
	$: filletsCenter_single = filletsCenter_for(isHorizontal, length, thickness, false);
	$: filletsCenter_dual = filletsCenter_for(isHorizontal, length, thickness, true);
	$: filletsDirection_single = isHorizontal ? Direction.right : Direction.down;
	$: filletsDirection_dual = isHorizontal ? Direction.left : Direction.up;
	$: title_left = (length - title_width - 20) / 2;

	function style_for(isHorizontal: boolean, line_left: number, zindex: number, top: number, origin_y: number, margin: number, thickness: number, length: number, $w_separator_color: string): string {
		return isHorizontal
			? `top:${origin_y}px; z-index:${zindex}; position:${position}; left:${line_left}px; height:${thickness}px; width:${length - margin * 2}px; background-color:${$w_separator_color};`
			: `left:${line_left}px; z-index:${zindex}; position:${position}; top:${origin_y + margin}px; width:${thickness}px; height:${length - 6 - margin * 2}px; background-color:${$w_separator_color};`;
	}

	function filletsCenter_for(isHorizontal: boolean, length: number, thickness: number, forOtherEnd: boolean): Point {
		return isHorizontal
			? new Point(forOtherEnd ? length - 6 : 0, thickness / 2)
			: new Point(thickness / 2, forOtherEnd ? length - 6 : 0);
	}

</script>

<div class={class_name} style={separatorStyle}>
	{#if has_fillets}
		<Fillets
			thickness={thickness}
			radius={corner_radius}
			color={$w_separator_color}
			center={filletsCenter_single}
			direction={filletsDirection_single}/>
		{#if has_double_fillet}
			<Fillets
				thickness={thickness}
				radius={corner_radius}
				center={filletsCenter_dual}
				color={$w_separator_color}
				direction={filletsDirection_dual}/>
		{/if}
	{/if}
</div>
{#if has_thin_divider}
	{#if isHorizontal}
		<div class='thin-horizontal-divider'
			style='
				height:{0.05}px;
				position:{position};
				z-index:{zindex + 1};
				width:{length - 21}px;
				left:{line_left + 8}px;
				top:{origin.y + thickness / 2}px;
				background-color:{thin_line_color};'>
		</div>
	{:else}
		<div class='thin-vertical-divider'
			style='
				width:{0.05}px;
				top:{origin.y}px;
				position:{position};
				z-index:{zindex + 1};
				height:{length - 6}px;
				left:{origin.x - 0.05}px;
				background-color:{thin_line_color};'>
		</div>
	{/if}
{/if}
{#if !!title}
	{#if handle_mouseUp}
		<div class='clickable-title'
			style='
				left:-1px;
				width: 100%;
				display: flex;
				position:absolute;
				top:{title_top + 6}px;
				justify-content: center;'>
			<Clickable_Label
				label={title}
				zindex={zindex + 1}
				label_underline={true}
				font_size={title_font_size}
				handle_mouseUp={handle_mouseUp}/>
		</div>
	{:else}
		<div class='static-title'
			style='
				z-index:{zindex};
				padding: 0px 5px;
				position:{position};
				white-space: nowrap;
				left:{title_left}px;
				z-index:{zindex + 2};
				top:{title_top + 1}px;
				width:{title_width}px;
				font-size:{title_font_size}px;
				background-color:{$w_background_color};'>
			{title}
		</div>
	{/if}
{/if}