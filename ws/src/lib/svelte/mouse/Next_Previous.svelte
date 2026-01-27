<script lang='ts'>
	import { Point, S_Mouse, S_Element, T_Request, T_Direction, T_Action, T_Hit_Target, T_Mouse_Detection } from '../../ts/common/Global_Imports';
	import { e, k, hits, colors, elements, svgPaths } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import { onMount } from 'svelte';
	export let size = 24;
	export let name = k.empty;
	export let top_offset = -7.5;
	export let origin = Point.zero;
	export let custom_svgPaths: { up?: string, down?: string } | null = null;
	export let closure: (column: number, event?: MouseEvent | null, element?: HTMLElement | null, isFirstCall?: boolean) => any;
	const titles = [T_Direction.previous, T_Direction.next];
	const { w_s_hover, w_autorepeat } = hits;
	let s_elements: S_Element[] = [];
	let button_elements: HTMLElement[] = [];
	let autorepeat_isFirstCall: boolean[] = [];			// Track first call for each button
	let autorepeat_events: (MouseEvent | null)[] = [];	// Capture events for each button

	onMount(() => {
		titles.forEach((title, button_id) => {
			const s_element = elements.s_element_for(new Identifiable(`next-prev-${name}-${title}`), T_Hit_Target.button, title);
			s_elements[button_id] = s_element;
			if (button_elements[button_id]) {
				s_element.set_html_element(button_elements[button_id]);
			}
			s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
				return handle_s_mouse(s_mouse, button_id);
			};
			s_element.mouse_detection = T_Mouse_Detection.autorepeat;
			autorepeat_isFirstCall[button_id] = true;
			s_element.autorepeat_callback = () => {
				if (autorepeat_events[button_id]) {
					const isFirst = autorepeat_isFirstCall[button_id];
					autorepeat_isFirstCall[button_id] = false;
					closure(button_id, autorepeat_events[button_id], button_elements[button_id], isFirst);
				}
			};
			s_element.autorepeat_id = button_id;
		});
		return () => {
			s_elements.forEach(s => hits.delete_hit_target(s));
		};
	});

	$: index_forHover = s_elements.findIndex(s => s.hasSameID_as($w_s_hover));
	$: isAutorepeating = (button_id: number) => s_elements[button_id]?.hasSameID_as($w_autorepeat) ?? false;

	function get_path_for(title: string, button_id: number): string {
		if (!custom_svgPaths) {
			return svgPaths.fat_polygon_path_for(String(title), size);
		} else {
			if (button_id === 0 && custom_svgPaths.up) {
				return custom_svgPaths.up + ' ' +
				svgPaths.fat_polygon_path_for('up', size);
			}
			if (button_id === 1 && custom_svgPaths.down) {
				return custom_svgPaths.down + ' ' +
				svgPaths.fat_polygon_path_for('down', size);
			}
		}
		return k.empty;
	}

	function is_using_custom_svgPaths(button_id: number): boolean {
		if (!custom_svgPaths) return false;
		return (button_id === 0 && !!custom_svgPaths.up) || (button_id === 1 && !!custom_svgPaths.down);
	}

	function get_svg_transform(button_id: number): string {
		const isCustom = is_using_custom_svgPaths(button_id);
		// Perfect centering for custom icons (+ and -)
		// Small vertical nudge (0.5px down) for triangles for better visual alignment
		return isCustom 
			? 'translate(-50%, -50%)' 
			: 'translate(-50%, calc(-50% + 0.5px))';
	}

	function get_stroke_color(button_id: number): string {
		// Use colors.default for triangular arrows (like Triangle_Button), colors.border for custom stroke-only icons
		return is_using_custom_svgPaths(button_id) ? colors.border : colors.default;
	}

	function handle_s_mouse(s_mouse: S_Mouse, button_id: number): boolean {
		if (s_mouse.isDown && s_mouse.event) {
			autorepeat_events[button_id] = s_mouse.event;
			autorepeat_isFirstCall[button_id] = true;
		} else if (s_mouse.isUp) {
			autorepeat_events[button_id] = null;
			autorepeat_isFirstCall[button_id] = true;
		}
		return true;
	}

</script>

<div class='{name}-next-previous'
	style='
		top: {top_offset}px;
		display:flex;
		position:absolute;
		left: {origin.x}px;
		flex-direction:row;
		align-items:center;'>
	{#each titles as title, button_id}
		<button class='{name}-{title}-button'
			bind:this={button_elements[button_id]}
			class:held={isAutorepeating(button_id)}
			style='
				padding: 0;
				border: none;
				display: flex;
				position:relative;
				align-items: center;
				width: {size - 5}px;
				height: {size + 5}px;
				justify-content: center;
				background-color: transparent;'>
			<svg class='svg-button-path'
				width={size}
				height={size}
				style='display: block; position: absolute; top: 50%; left: 50%; transform: {get_svg_transform(button_id)};'
				viewBox='0 0 {size} {size}'>
				<path
					d={get_path_for(title, button_id)}
					stroke={get_stroke_color(button_id)}
					stroke-width={is_using_custom_svgPaths(button_id) ? '1.5' : '0.75'}
					fill={is_using_custom_svgPaths(button_id) ? 'white' : (index_forHover === button_id ? colors.background_special_blend('black', k.opacity.medium) : 'white')}/>
			</svg>
		</button>
	{/each}
</div>

<style>
	button.held {
		transform: scale(0.95);
		transition: transform 0.1s ease;
	}
</style>
