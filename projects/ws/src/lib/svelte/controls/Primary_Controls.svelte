<script lang='ts'>
	import { c, e, g, k, core, u, x, show, colors, search } from '../../ts/common/Global_Imports';
	import { features, elements, controls, svgPaths } from '../../ts/common/Global_Imports';
	import { Point, T_Layer, T_Graph, T_Control, T_Breadcrumbs, S_Mouse } from '../../ts/common/Global_Imports';
	import Search_Toggle from '../search/Search_Toggle.svelte';
	import Next_Previous from '../mouse/Next_Previous.svelte';
	import Segmented from '../mouse/Segmented.svelte';
	import Separator from '../draw/Separator.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';
	import Button from '../mouse/Button.svelte';
	const y_center = 10.5;
	const { w_t_search } = search;
	const { w_rect_ofGraphView } = g;
	const { w_count_window_resized } = e;
	const { w_background_color } = colors;
	const hamburger_size = k.height.button;
	const hamburger_path = svgPaths.hamburgerPath(hamburger_size);
	const s_hamburger = elements.s_control_forType(T_Control.details);
	const { w_t_graph, w_id_popupView, w_show_search_controls, w_t_breadcrumbs } = show;
	const search_left = -38 - (features.has_details_button ? 0 : 26) + (features.allow_tree_mode ? 0 : 0);
	let width = g.windowSize.width - 16;
	let lefts: Array<number> = [];
	layout_controls();

	// always show controls and breadcrumbs
	// nicely documented in notes/design/controls.md

	function togglePopupID(id) { $w_id_popupView = ($w_id_popupView == id) ? null : id; }
	function handle_recents_mouseClick(index: number, event?: MouseEvent | null, element?: HTMLElement | null, isFirstCall?: boolean) { 
		x.ancestry_next_focusOn(index == 1); 
	}
	function handle_scale_control(index: number, event?: MouseEvent | null, element?: HTMLElement | null, isFirstCall?: boolean) {
		const t_control = index === 0 ? T_Control.shrink : T_Control.grow;
		if (event && element !== undefined) {
			const s_mouse = isFirstCall 
				? S_Mouse.down(event, element)
				: S_Mouse.repeat(event, element);
			e.handle_s_mouseFor_t_control(s_mouse, t_control);
		}
	}
	function handle_breadcrumbs(types: Array<T_Breadcrumbs | null>) {
		$w_t_breadcrumbs = types.length > 0 ? types[0] : T_Breadcrumbs.selection;
	}

	$: {
		const _ = `${$w_rect_ofGraphView.description}:::${$w_count_window_resized}`;
		width = g.windowSize.width - 16;
	}

	$: {
		const _ = $w_t_search;
		layout_controls();
	}

	function layout_controls() {
		const left_widths = {
			0: features.has_details_button ? 18  : -7,									// details
			1: features.allow_tree_mode	   ? 20  : -70,									// graph type
			2: features.has_zoom_controls  ? 84  : features.allow_tree_mode ? 36 : 34,	// scale controls (grow/shrink)
			3: 108,																		// search toggle
			4: features.allow_search	   ? -32 : 6,									// easter egg
			5: 2,																		// separator
			6: 0,																		// breadcrumbs types
			7: 6,																		// recents
			8: 44,																		// breadcrumbs
		};
		lefts = u.cumulativeSum(Object.values(left_widths));
	}
	
</script>

{#key width, $w_background_color}
	<div class='primary-controls'
		style='
			left: 2px;
			top: 8.8px;
			height: 21px;
			width: {width}px;
			position: absolute;
			z-index: {T_Layer.frontmost};'>
		<Next_Previous name='recents'
			size={28}
			origin={Point.x(lefts[7])}
			top_offset={y_center - 17.66}
			closure={handle_recents_mouseClick}/>
		{#if !$w_id_popupView}
			{#if features.has_details_button}
				<Button name='details-toggle'
					border_thickness=0
					color='transparent'
					s_button={s_hamburger}
					center={new Point(lefts[0], y_center)}
					handle_s_mouse={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.details)}>
					<svg class='hamburger-svg'
						style='
							height: 17px;
							width: 20.5px;
							position: absolute;'
						viewBox='-1 -1 19 19'>
						<path
							d={hamburger_path}
							stroke-width='0.75'
							class='hamburger-path'
							fill={s_hamburger.isHovering ? 'white' : 'black'}
							stroke={s_hamburger.isHovering ? 'darkgray' : 'transparent'}/>
					</svg>
				</Button>
			{/if}
			{#if features.allow_tree_mode}
				{#key $w_t_graph}
					<Segmented name='graph-type'
						width={80}
						selected={[$w_t_graph]}
						origin={Point.x(lefts[1])}
						titles={[T_Graph.tree, T_Graph.radial]}
						handle_selection={(titles) => controls.handle_segmented_choices('graph', titles)}/>
				{/key}
			{/if}
			{#if features.allow_search}
				<Search_Toggle
					top={-0.5}
					left={search_left}
					width={lefts[3] + (features.has_details_button ? 0 : 26)}/>
			{/if}
			{#if features.has_zoom_controls}
				<Next_Previous name='scale'
					size={28}
					origin={Point.x(lefts[2])}
					top_offset={y_center - 18}
					custom_svgPaths={{
						down: svgPaths.dash(28, 7),
						up: svgPaths.t_cross(28, 6)
					}}
					closure={handle_scale_control}/>
			{/if}
			{#if !features.has_details_button}
				<Button name='easter-egg'
					width={20}
					height={30}
					color='transparent'
					zindex={T_Layer.frontmost}
					center={new Point(lefts[4], 10)}
					style='border: none; background: none;'
					s_button={s_hamburger}
					handle_s_mouse={(s_mouse) => e.handle_s_mouseFor_t_control(s_mouse, T_Control.details)}/>
			{/if}
			<Separator name='after-controls'
				isHorizontal={false}
				origin={new Point(lefts[5], -6)}
				length={g.controls_boxHeight + 0.5}
				thickness={k.thickness.separator.main}
				corner_radius={k.radius.fillets.thick}/>
			<Breadcrumbs
				left={lefts[8]}
				centered={true}
				width={g.windowSize.width - lefts[8] - 170}/>
			<Segmented name='breadcrumb-type'
				width={80}
				selected={[$w_t_breadcrumbs]}
				origin={Point.x(width - 114)}
				handle_selection={handle_breadcrumbs}
				titles={[T_Breadcrumbs.focus, T_Breadcrumbs.selection, T_Breadcrumbs.recents]}/>
		{/if}
	</div>
	<Separator name='bottom-separator'
		origin={new Point(2, g.controls_boxHeight - 5)}
		corner_radius={k.radius.fillets.thick}
		thickness={k.thickness.separator.main}
		length={g.windowSize.width + 2.5}
		zindex={T_Layer.frontmost}
		has_double_fillet={true}
		isHorizontal={true}/>
{/key}
