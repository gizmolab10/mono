<script lang='ts'>
	import { g, k, s, u, x, debug, colors, signals, elements, svgPaths } from '../../ts/common/Global_Imports';
	import { Size, Point, S_Component } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Hit_Target } from '../../ts/common/Enumerations';
	import Mouse_Responder from '../mouse/Mouse_Responder.svelte';
	import Widget_Title from '../widget/Widget_Title.svelte';
	import { onMount } from 'svelte';
	const { w_thing_color, w_background_color } = colors;
	const { w_s_title_edit, w_ancestry_focus } = s;
	const { w_items: w_grabbed } = x.si_grabs;
	const height = k.height.row;
	let ancestry = $w_ancestry_focus;
	let s_widget = ancestry.g_widget.s_widget;
	let origin_ofWidget = Point.zero;
	let center_ofBorder = Point.zero;
	let s_title = s_widget.s_title;
	let size_ofBorder = Size.zero;
	let s_component: S_Component;
	let width_ofBorder = 0;
	let width_ofTitle = 0;

	let color = s_widget.color;
	let svg_dasharray = k.empty;
	let svg_fillColor = 'transparent';
	let svg_strokeColor = 'transparent';
	let background_color = s_widget.background_color;

	//////////////////////////////////
	//								//
	//	mimic a Widget				//
	//	ignores rebuild & recreate	//
	//								//
	//////////////////////////////////

	layout_focus();

	s_component = signals.handle_reposition_widgets_atPriority(2, ancestry, T_Hit_Target.widget, (received_ancestry) => {
		layout_focus();
	});

	onMount(() => { return () => s_component.disconnect(); });

	function handle_s_mouse(s_mouse) { debug.log_radial(` ${s_mouse.descriptionFor('FOCUS')}`); }

	$: { const _ = $w_ancestry_focus; layout_focus();}
	$: svg_outline_color = $w_ancestry_focus.isGrabbed ? background_color : color;

	$: {
		const _ = `${u.descriptionBy_titles($w_grabbed)}
		:::${$w_ancestry_focus?.isGrabbed}
		:::${$w_ancestry_focus?.isEditing}
		:::${$w_ancestry_focus}
		:::${$w_s_title_edit}
		:::${$w_thing_color}`;
		update_colors();
		update_svg();
	}

	function update_colors() {
		ancestry = $w_ancestry_focus;
		s_widget = ancestry.g_widget.s_widget;
		color = s_widget.color;
		background_color = s_widget.background_color;
		svg_strokeColor = s_widget.shows_border ? color : 'transparent';
		svg_fillColor = s_widget.shows_border ? $w_background_color : 'transparent';
	}

	function layout_focus() {
		const g_focus = $w_ancestry_focus?.g_widget;
		const width = g_focus.width_ofWidget;
		origin_ofWidget = g_focus.origin;
		width_ofTitle = width;
		width_ofBorder = width + 20;
		size_ofBorder = new Size(width - 5, k.height.row);
		center_ofBorder = new Point(width_ofBorder - 3, height).dividedInHalf;
	}

	function update_svg() {
		const focus = $w_ancestry_focus;
		const grabbed = focus?.isGrabbed ?? false;
		const editing = focus?.isEditing ?? false;
		svg_strokeColor = grabbed ? color : 'transparent';
		svg_dasharray = editing ? k.dasharray.editing : k.empty;
		svg_fillColor = grabbed ? $w_background_color : 'transparent';
	}

</script>

<div class='radial-focus' name = {s_component.id}
	style='
		position : absolute;
		height : {height}px;
		width : {width_ofBorder}px;
		z-index : {T_Layer.widget};
		top : {origin_ofWidget.y}px;
		left : {origin_ofWidget.x}px;'>
		<Mouse_Responder
			height = {height}
			width = {width_ofBorder}
			center = {center_ofBorder}
			zindex = {T_Layer.widget}
			cursor = {k.cursor_default}
			name = 'radial-focus-border'
			handle_s_mouse = {handle_s_mouse}>
			<svg
				class='radial-focus-svg'
				style='
					height : {height}px;
					position : absolute;
					width : {width_ofBorder}px;'>
				<path
				svg_outline_color
					stroke-width = '1'
					fill = {background_color}
					class = 'radial-focus-path'
					stroke = {svg_outline_color}
					stroke-dasharray = {svg_dasharray}
					d = {svgPaths.pill(center_ofBorder, size_ofBorder)}/>
			</svg>
		</Mouse_Responder>
	<div class='radial-focus-title'
		style='
			top : 0.3px;
			left : -3px;
			position : absolute;
			background-color : {background_color};'>
		<Widget_Title
			s_title = {s_title}
			fontSize = {k.font_size.common}px/>
	</div>
</div>