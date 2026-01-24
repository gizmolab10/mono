<script lang='ts'>
	import { g, k, core, u, x, hits, show, colors, radial, debug, g_graph_radial } from '../../ts/common/Global_Imports';
	import { Point, T_Layer, G_Cluster, T_Cluster_Pager, S_Mouse } from '../../ts/common/Global_Imports';
	import Cluster_Pager from '../mouse/Cluster_Pager.svelte';
	import Curved_Text from '../text/Curved_Text.svelte';
	import Fillets from '../draw/Fillets.svelte';
	import { onMount, onDestroy } from 'svelte';
	export let g_cluster: G_Cluster;
	export let color = 'red';
	const show_fat_arc = false;
	const { w_s_hover } = hits;
	const { w_thing_fontFamily } = x;
	const { w_t_cluster_pager } = show;
	const s_paging = g_cluster.s_paging;
	const inset = k.radial_widget_inset;
	const { w_background_color } = colors;
	const { w_g_cluster, w_resize_radius } = radial;
	const g_cluster_pager = g_cluster.g_cluster_pager;
	let thumb_arc_element: HTMLElement | null = null;
	let thumbFill = 'transparent';
	let pager_offset = 8;

	//////////////////////////////////////////////////////
	//													//
	//		draw arc, thumb, label, fork line			//
	//													//
	//	radial graph => radial rings => this			//
	//	ignores signals: {rebuild, recreate}			//
	//	uses g_cluster => {geometry, text} &			//
	//	  {g_cluster_pager, g_thumbArc} => svg paths	//
	//													//
	//////////////////////////////////////////////////////
	
	$: textBackground = $w_t_cluster_pager ? radial.s_rotation.isHighlighted ? $w_background_color : colors.special_blend(color, $w_background_color, radial.s_resizing.fill_opacity) : 'transparent';
	$: `${$w_g_cluster}:::${$w_s_hover?.id}`, thumbFill = colors.special_blend(color, $w_background_color, radial.s_rotation.isHighlighted ? k.opacity.cluster.thumb : s_paging.thumb_opacity);
	$: ({ start_thumb_transform, end_thumb_transform } = g_cluster_pager.layout_endpoints_onArc(curved_text_radius, pager_angle, arcLength));
	$: $w_t_cluster_pager, pager_offset = ($w_t_cluster_pager == T_Cluster_Pager.sliders) ? -8 : 8;
	$: arcLength = u.getWidth_ofString_withSize(g_cluster.cluster_title, pager_font_size) * 1.3;
	$: pager_color = colors.special_blend(color, $w_background_color, k.opacity.cluster.titles);
	$: origin = g.center_ofGraphView.offsetBy(Point.square(-radius));
	$: viewBox=`${-inset} ${-inset} ${radius * 2} ${radius * 2}`;
	$: curved_text_radius = $w_resize_radius + pager_offset;
	$: pager_font_size = `${k.font_size.cluster_slider}px`;
	$: pager_angle = -g_cluster_pager.angle_ofFork;
	$: radius = $w_resize_radius + inset;
	$: diameter = radius * 2;
	$: wrapper_style = `
		position: absolute;
		width: ${diameter}px;
		height: ${diameter}px;
		z-index: ${T_Layer.paging};
		cursor: ${k.cursor_default};
		left: ${g.center_ofGraphView.x - radius}px;
		top: ${g.center_ofGraphView.y - radius}px;
	`.removeWhiteSpace();

	const unsubscribe = w_t_cluster_pager.subscribe(value => {
		pager_offset = (value == T_Cluster_Pager.sliders) ? -2 : 8;
	});

	onMount(() => {
		s_paging.handle_s_mouse = handle_s_mouse;
		if (!!thumb_arc_element) {
			s_paging.set_html_element(thumb_arc_element);
		}
	});

	onDestroy(() => {
		unsubscribe();
		// Note: s_paging is managed by radial, don't delete it here
	});

	function handle_s_mouse(s_mouse: S_Mouse): boolean {
		if (s_mouse.isDown && s_mouse.event) {
			const angle_ofPage = g.mouse_angle_fromGraphCenter.angle_normalized();
			debug.log_radial(` begin paging  ${angle_ofPage.asDegrees()}`);
			s_paging.active_angle = angle_ofPage;
			s_paging.basis_angle = angle_ofPage;
			$w_g_cluster = g_cluster;
			radial.cursor = radial.cursor_forRingZone;
			return true;
		}
		return false;
	}

	function handle_page(delta: number) {
		g_cluster.g_paging?.addTo_paging_index_for(delta);
		g.layout();
	}

	function handle_backward() { handle_page(-1); }
	function handle_forward() { handle_page(1); }

</script>

<div class='radial-cluster'
	style='
		z-index:{T_Layer.paging};
		background-color: transparent;'>
	<div class='cluster-wrapper'
		style={wrapper_style}>
        <svg class='svg-radial-cluster'
			viewBox={viewBox}>
			{#if show_fat_arc}
				<path class='path-arc-fat'
					fill='transparent'
					d={g_cluster_pager.svgPathFor_fatArc}
					stroke-width={k.thickness.radial.fork}
					stroke={colors.special_blend('transparent', $w_background_color, k.opacity.cluster.armature)}/>
			{/if}
			<path class='path-fork'
				fill='transparent'
				d={g_cluster_pager.svgPathFor_radialFork}
				stroke-width={k.thickness.radial.fork * 2}
				stroke={colors.special_blend(color, $w_background_color, k.opacity.cluster.faint)}/>
			{#if $w_t_cluster_pager == T_Cluster_Pager.sliders}
				<path class='path-arc-slider'
					fill='transparent'
					stroke-width={k.thickness.radial.fork}
					d={g_cluster_pager.svgPathFor_arcSlider}
					stroke={colors.special_blend(color, $w_background_color, k.opacity.cluster.armature)}
					pointer-events="stroke"/>
				{#if g_cluster.widgets_shown > 1}
					{#if g_cluster.isPaging}
						<path class='path-thumb'
							fill={thumbFill}
							bind:this={thumb_arc_element}
							id={`thumb-${g_cluster.name}`}
							d={g_cluster.g_thumbArc.svgPathFor_arcSlider}/>
					{/if}
				{/if}
			{/if}
        </svg>
	</div>
</div>
<Curved_Text
	zindex={T_Layer.ring}
	radius={curved_text_radius}
	text={g_cluster.cluster_title}
	g_cluster_pager={g_cluster_pager}
	font_family={$w_thing_fontFamily}
	background_color={textBackground}
	center_ofArc={g.center_ofGraphView}
	angle={-g_cluster_pager.angle_ofFork}
	font_size={k.font_size.cluster_slider}px
	color={colors.special_blend(color, $w_background_color, k.opacity.cluster.titles)}/>
{#if $w_t_cluster_pager == T_Cluster_Pager.steppers && g_cluster.isPaging}
	<svg class='pager-container'
		style='
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			overflow: visible;
			position: absolute;
			pointer-events: none;
			z-index: {T_Layer.text};'>
		<Cluster_Pager
			viewBox={viewBox}
			size={k.height.dot}
			color={pager_color}
			direction='backward'
			handle_mouseUp={handle_backward}
			name={g_cluster.name + '-start'}
			thumbTransform={start_thumb_transform}/>
		<Cluster_Pager
			viewBox={viewBox}
			direction='forward'
			size={k.height.dot}
			color={pager_color}
			handle_mouseUp={handle_forward}
			name={g_cluster.name + '-end'}
			thumbTransform={end_thumb_transform}/>
	</svg>
{/if}
