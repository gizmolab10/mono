<script lang='ts'>
	import { e, g, k, core, x, hits, busy, debug, colors, radial, signals, svgPaths } from '../../ts/common/Global_Imports';
	import { T_Layer, T_Radial_Zone, T_Hit_Target, S_Component, S_Mouse } from '../../ts/common/Global_Imports';
	import { Thing, Point, Angle, g_graph_radial, databases } from '../../ts/common/Global_Imports';
	import Radial_Cluster from './Radial_Cluster.svelte';
	import { onMount } from 'svelte';
	const name = 'rings';
	const { w_s_hover } = hits;
	const { w_s_title_edit } = x;
	const { w_count_mouse_up } = e;
	const { w_ancestry_focus } = x;
	const { w_thing_color } = colors;
	const ring_width = k.thickness.radial.ring;
	const { w_g_cluster, w_rotate_angle, w_resize_radius } = radial;
	let color = $w_ancestry_focus?.thing?.color ?? colors.default_forThings;
	let rotate_element: HTMLElement | null = null;
	let resize_element: HTMLElement | null = null;
	let mouse_up_count = $w_count_mouse_up;
	let resize_fill = 'transparent';
	let rotate_fill = 'transparent';
	let s_component: S_Component;
	let reattachments = 0;

	$: outer_diameter  = outer_radius * 2;
	$: outer_radius	   = middle_radius;// + ring_width;
	$: middle_radius   = $w_resize_radius + ring_width;
	$: reticle_svgPath = debug.reticle ? reticle_path() : '';
	$: viewBox		   = `${-ring_width}, ${-ring_width}, ${outer_diameter}, ${outer_diameter}`;
	$: resize_svgPath  = svgPaths.circle(Point.square($w_resize_radius), $w_resize_radius - 0.3, true);
	$: rotate_svgPath  = svgPaths.annulus(Point.square($w_resize_radius), middle_radius, ring_width);

	s_component = signals.handle_reposition_widgets_atPriority(2, null, T_Hit_Target.rings, (received_ancestry) => {
		reattachments += 1;
	});

	onMount(() => {
		update_fill_colors();
		// Set up click handlers for centralized hit system
		radial.s_rotation.handle_s_mouse = handle_s_mouse_forRotation;
		radial.s_resizing.handle_s_mouse = handle_s_mouse_forResize;
		return () => s_component.disconnect();
	});

	$: {
		if (!!resize_element) {
			radial.s_resizing.set_html_element(resize_element);
		}
	}

	$: {
		if (!!rotate_element) {
			radial.s_rotation.set_html_element(rotate_element);
		}
	}

	$: {
		if (!!$w_s_hover) {
			setTimeout(() => {
				update_fill_colors();
			}, 100);
		}
	}
		
	$: {
		const thing = $w_ancestry_focus?.thing;	
		if (!!thing && thing.id == $w_thing_color?.split(k.separator.generic)[0]) {
			color = thing.color ?? colors.default_forThings;
		}
	}

	$: {
		if (mouse_up_count != $w_count_mouse_up) {
			mouse_up_count = $w_count_mouse_up;
			s_reset();			// mouse up ... end all (rotation, resizing, paging)
		}
	}

	function update_fill_colors() {
		resize_fill	= radial.s_resizing.fill_color;
		rotate_fill	= radial.s_rotation.fill_color;
	}

	function s_reset() {
		radial.reset();
		e.mouse_timer_forName(name).reset();
		update_fill_colors();
	}

	function handle_s_mouse_forRotation(s_mouse: S_Mouse): boolean {
		if (s_mouse.isDown && s_mouse.event) {
			const zone = radial.ring_zone_atMouseLocation;
			const angle_ofMouseDown = g.mouse_angle_fromGraphCenter;
			const angle_ofRotation = angle_ofMouseDown.add_angle_normalized(-$w_rotate_angle);
			debug.log_radial(` begin rotate  ${angle_ofRotation.asDegrees()}`);
			radial.s_rotation.active_angle = angle_ofMouseDown;
			radial.s_rotation.basis_angle = angle_ofRotation;
			radial.cursor = radial.cursor_forRingZone;
			return true;
		}
		return false;
	}

	function handle_s_mouse_forResize(s_mouse: S_Mouse): boolean {
		if (s_mouse.isDown && s_mouse.event) {
			const zone = radial.ring_zone_atMouseLocation;
			const angle_ofMouseDown = g.mouse_angle_fromGraphCenter;
			const angle_ofRotation = angle_ofMouseDown.add_angle_normalized(-$w_rotate_angle);
			const change_ofRadius = g.mouse_distance_fromGraphCenter - $w_resize_radius;
			debug.log_radial(` begin resize  ${change_ofRadius.asInt()}`);
			radial.s_rotation.active_angle = angle_ofMouseDown + Angle.quarter;	// needed for cursor
			radial.s_rotation.basis_angle = angle_ofRotation + Angle.quarter;		// "
			radial.s_resizing.basis_radius = change_ofRadius;
			radial.cursor = radial.cursor_forRingZone;
			return true;
		}
		return false;
	}

	function reticle_path(): string {
		const center = $w_resize_radius;
		const start = -ring_width;
		const end = outer_diameter - ring_width;
		return `M ${start} ${center} L ${end} ${center} M ${center} ${start} L ${center} ${end}`;
	}

	$: rings_style = `
		position: absolute;
		z-index: ${T_Layer.ring};
		cursor: ${radial.cursor};
		width: ${outer_diameter}px;
		height: ${outer_diameter}px;
		top: ${g.center_ofGraphView.y - outer_diameter / 2}px;
		left: ${g.center_ofGraphView.x - outer_diameter / 2}px;
	`.removeWhiteSpace();

</script>

{#key reattachments}
	{#if !debug.hide_rings}
		<div class = 'rings'
			id = {s_component.id}
			style = '
				user-select: none;
				-ms-user-select: none;
				-moz-user-select: none;
				z-index:{T_Layer.ring};
				-webkit-user-select: none;'>
			<div class='ring-paths'
				style={rings_style}>
				<svg class = 'rings-svg'
					viewBox = {viewBox}>
					<path class = 'resize-path'
						fill = {resize_fill}
						d = {resize_svgPath}
						bind:this = {resize_element}/>
					{#if debug.reticle}
						<path class = 'reticle-path'
							stroke = 'green'
							fill = 'transparent'
							d = {reticle_svgPath}/>
					{/if}
					<path class = 'rotate-path'
						fill = {rotate_fill}
						d = {rotate_svgPath}
						bind:this = {rotate_element}/>
				</svg>
			</div>
		</div>
	{/if}
	<div class = 'paging-arcs'
		style = '
			z-index:{T_Layer.paging};
			background-color: transparent;'>
		{#each g_graph_radial.g_clusters as g_cluster}
			{#if !!g_cluster && (g_cluster.widgets_shown > 0)}
				<Radial_Cluster
					color = {color}
					g_cluster = {g_cluster}/>
			{/if}
		{/each}
	</div>
{/key}
