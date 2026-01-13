<script lang='ts'>
	import { k, Rect, Size, Point, colors, details } from '../../ts/common/Global_Imports';
	import Glow_Button from '../mouse/Glow_Button.svelte';
	import G_Repeater from '../../ts/geometry/G_Repeater';
	import Separator from '../draw/Separator.svelte';
	export let toggle_hidden: (title: string) => void;
	export let font_size = k.font_size.details;
    export let isSelected: boolean = false;
    export let banner_id: string = k.empty;
	export let titles: string[];
	export let height: number;
	export let width: number;
	$: banner_title = titles[0];
	const { w_background_color } = colors;
	$: g_repeater = new G_Repeater(titles, height, width, 0, 0, 7, 0, false, font_size, true);
	let banner_color = colors.banner;

	//////////////////////////////////////////////////////////////////////////////////
	//																				//
	//	titles:	one for each buttons, separated by a vertical separator with wings	//
	//																				//
	//	g_repeater computes layout													//
	//	handle click separately for each title's button								//
	//  first button is the widest, at the left										//
	//																				//
	//////////////////////////////////////////////////////////////////////////////////

	$: {
		const _ = $w_background_color;
		banner_color = colors.banner;
	}

	function intercept_click(title: string) {
		if (title === banner_id || titles.length == 1) {		// banner_title and title are dynamic, banner_id is NOT
			toggle_hidden(banner_id);
		} else {
			details.select_next(banner_id, title);
		}
	}

</script>

<div class='glows-banner'
	style='
		display: flex;
		width: {width}px;
		position: relative;
		flex-direction: row;
		align-items: stretch;'>
	<Separator name='top-of-banner'
		origin={Point.zero}
		isHorizontal={true}
		has_thin_divider={true}
		corner_radius={k.radius.fillets.thin}
		thickness={k.thickness.separator.banners}/>
	{#each g_repeater.titles as title, index}
		<Glow_Button
			title={title}
			height={height}
			name={banner_title}
			banner_id={banner_id}
			font_size={font_size}
			handle_mouseUp={intercept_click}
			detects_autorepeat={title != banner_id}
			width={g_repeater.button_width_for(index)}/>
		{#if index > 0}
			<Separator name='between-buttons'
				length={height + 6}
				isHorizontal={false}
				has_thin_divider={true}
				thickness={k.thickness.separator.banners}
				corner_radius={k.radius.fillets.ultra_thin}
				origin={new Point(g_repeater.button_left_for(index), 1)}/>
		{/if}
	{/each}
	<Separator name='bottom-of-banner'
		isHorizontal={true}
		origin={Point.y(height)}
		corner_radius={k.radius.fillets.thin}
		thickness={k.thickness.separator.banners}/>
</div> 