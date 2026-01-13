<script lang='ts'>
	import { h, k, core, u, x, hits, show, debug, colors, signals, controls, elements, svgPaths } from '../../ts/common/Global_Imports';
	import { S_Element, S_Component, T_Layer, T_Counts_Shown, T_Hit_Target } from '../../ts/common/Global_Imports';
	import { onMount, onDestroy } from 'svelte';
	import SVG_D3 from '../draw/SVG_D3.svelte';
	export let pointsTo_child = true;
    export let zindex = T_Layer.dot;
	export let s_reveal!: S_Element;
	const viewBox_left = 0;
	const size = k.height.dot;
	const viewBox_width = size;
	const { w_s_hover } = hits;
	const { w_thing_title } = x;
	const ancestry = s_reveal.ancestry;
	const g_widget = ancestry.g_widget;
	const { w_items: w_grabbed } = x.si_grabs;
	const viewBox = k.tiny_outer_dots.viewBox;
	const reveal_count = g_widget.reveal_count;
	const show_reveal_count = reveal_count > 1;
	const { w_items: w_expanded } = x.si_expanded;
	const { w_t_countDots, w_show_countsAs } = show;
	const { w_thing_color, w_background_color } = colors;
	const count_fontSize = reveal_count < 100 ? reveal_count < 10 ? 10 : 7 : 5;
	const reveal_count_top = reveal_count < 100 ? reveal_count < 10 ? 2 : 4 : 5.6;
	let fill_color = debug.lines ? 'transparent' : s_reveal.fill;
	let svgPathFor_tiny_outer_dots: string | null = null;
	let svgPathFor_fat_center_dot: string | null = null;
	let svg_outline_color = s_reveal.svg_outline_color;
	let element: HTMLElement | null = null;
	let center = g_widget.center_ofReveal;
	let counts_color = s_reveal.stroke;
	let svgPathFor_revealDot = k.empty;
	let color = ancestry.thing?.color;
	let offsetFor_fat_center_dot = 0;
	let s_component: S_Component;
	let wrapper_style = k.empty;

	update_colors();

	s_component = signals.handle_reposition_widgets_atPriority(2, ancestry, T_Hit_Target.reveal, (received_ancestry) => {
		center = g_widget.center_ofReveal;
	});

	onMount(() => {
		update_svgPaths();
		s_reveal.isHovering = false;
		update_colors();
		return () => s_component.disconnect();
	});

	$: if (!!element) {
		s_reveal.set_html_element(element);
		s_reveal.handle_s_mouse = (s_mouse) => {
			if (s_mouse.isDown) {
				let focus_ancestry: Ancestry | null = null;
				if (controls.inRadialMode) {
					focus_ancestry = ancestry;
				} else if (ancestry.hasChildren || ancestry.thing.isBulkAlias) {
					h.ancestry_toggle_expansion(ancestry);
					if (show.isDynamic_focus && ancestry.hidden_by_depth_limit) {
						focus_ancestry = ancestry.ancestry_createUnique_byStrippingBack(ancestry.depth_limit - 1);
					}
				}
				focus_ancestry?.becomeFocus();
			}
			return true;
		};
	}

	onDestroy(() => {
		hits.delete_hit_target(s_reveal);
	});
	
	$: {
		const _ = `${u.descriptionBy_titles($w_grabbed)}
			:::${u.descriptionBy_titles($w_expanded)}
			:::${$w_s_hover?.id ?? 'null'}
			:::${$w_background_color}
			:::${$w_t_countDots}
			:::${$w_thing_title}
			:::${$w_thing_color}`;
		update_svgPaths();
		update_colors();
	}

	$: {
		wrapper_style = `
			cursor: pointer;
			width: ${size}px;
			position: absolute;
			z-index: ${zindex};
			height: ${size}px;
			top: ${center.y - size / 2}px;
			left: ${center.x - size / 2}px;
		`.removeWhiteSpace();
	}

	function update_colors() {
		// element_color is now reactive (uses thing_color automatically for dots)
		// hoverColor is also reactive (computed from element_color)
		fill_color = debug.lines ? 'transparent' : s_reveal.fill;
		svg_outline_color = s_reveal.svg_outline_color;
		counts_color = s_reveal.stroke;
		color = ancestry.thing?.color;
		debug.log_colors(`REVEAL ${ancestry.title}${s_reveal.isInverted ? ' INVERTED' : ''}`)
	}

	function update_svgPaths() {
		const thing = ancestry.thing;
		if (!!thing) {
			const dotsAre_hiding = ancestry.hidden_by_depth_limit && !ancestry.points_right;
			const show_fat_center_dot = thing.isBulkAlias || dotsAre_hiding;
			offsetFor_fat_center_dot = show_fat_center_dot ? 0 : -1;
			svgPathFor_revealDot = ancestry.svgPathFor_revealDot;
			svgPathFor_tiny_outer_dots = show_reveal_count ? ancestry.svgPathFor_tiny_outer_dot_pointTo_child(pointsTo_child) : null;
			svgPathFor_fat_center_dot = show_fat_center_dot ? svgPaths.circle_atOffset(size, 3) : null;
		}
	}

</script>

{#if s_reveal}
	<div class='reveal-wrapper'
		style={wrapper_style}
		bind:this={element}>
		<div class='reveal-dot'
			role="button"
			tabindex="0"
			style='
				width: {size}px;
				height: {size}px;
				overflow: visible;
				position: relative;'>
			<div style='
				top: 0px;
				left: 0px;
				width: {size}px;
				height: {size}px;
				position: absolute;'>
				<SVG_D3 name='reveal-dot-svg'
					svgPath={svgPathFor_revealDot}
					viewBox_width={viewBox_width}
					stroke={svg_outline_color}
					left={viewBox_left}
					fill={fill_color}
					height={size}
					width={size}
					top={0}/>
			</div>
			{#if !!svgPathFor_fat_center_dot}
				<div class='fat_center-dot' style='
					left:{offsetFor_fat_center_dot}px;
					top:{offsetFor_fat_center_dot}px;
					position:absolute;
					height:{size}px;
					width:{size}px;'>
					<SVG_D3 name='fat_center-dot-svg'
						svgPath={svgPathFor_fat_center_dot}
						stroke={counts_color}
						fill={counts_color}
						height={size}
						width={size}
					/>
				</div>
			{/if}
			<div class='reveal-count' style='
				overflow:visible;
				position:absolute;
				top:{k.tiny_outer_dots.offset.y}px;
				left:{k.tiny_outer_dots.offset.x}px;
				width:{k.tiny_outer_dots.diameter}px;
				height:{k.tiny_outer_dots.diameter}px;
				z-index:{T_Layer.frontmost};'>
				{#if ($w_show_countsAs == T_Counts_Shown.numbers) && show_reveal_count && !svgPathFor_fat_center_dot}
					<div class='reveal-count-number'
						style='
							left:-1.2px;
							width:100%;
							height:100%;
							position: absolute;
							text-align: center;
							color:{counts_color};
							vertical-align: middle;
							top:{reveal_count_top}px;
							font-size:{count_fontSize}px;
							shape-rendering: geometricPrecision;'>
						{reveal_count}
					</div>
				{:else if ($w_show_countsAs == T_Counts_Shown.dots) && !!svgPathFor_tiny_outer_dots}
					<svg class='tiny-outer-dots-svg'
						viewBox='{viewBox}'
						preserveAspectRatio='none'
						width={k.tiny_outer_dots.diameter}px
						height={k.tiny_outer_dots.diameter}px
						style='
							position: absolute;
							shape-rendering: geometricPrecision;'>
						<path
							fill={color}
							stroke={svg_outline_color}
							d={svgPathFor_tiny_outer_dots}
							vector-effect='non-scaling-stroke'/>
					</svg>
				{/if}
			</div>
		</div>
	</div>
{/if}
