<script lang='ts'>
	import { Point, S_Mouse, S_Element, T_Request, T_Direction, T_Action, T_Hit_Target, T_Mouse_Detection } from '../../ts/common/Global_Imports';
	import { e, k, hits, colors, elements, svgPaths } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import { onMount } from 'svelte';
	export let closure: (column: number, event?: MouseEvent | null, element?: HTMLElement | null, isFirstCall?: boolean) => any;
	export let custom_svgPaths: { up?: string, down?: string } | null = null;
	export let origin = Point.zero;
	export let has_title = false;
	export let top_offset = -7.5;
	export let name = k.empty;
	export let size = 24;
	const { w_s_hover, w_autorepeat } = hits;
	const base_titles = [T_Direction.previous, T_Direction.next];
	$: row_titles = has_title ? [name, ...base_titles] : base_titles;
	let button_elements: HTMLElement[] = [];
	let s_elements: S_Element[] = [];
	let autorepeat_events: (MouseEvent | null)[] = []; // Capture events for each button
	let autorepeat_isFirstCall: boolean[] = []; // Track first call for each button

	onMount(() => {
		row_titles.forEach((title, index) => {
			const s_element = elements.s_element_for(new Identifiable(`next-prev-${name}-${title}`), T_Hit_Target.button, title);
			s_elements[index] = s_element;
			if (button_elements[index]) {
				s_element.set_html_element(button_elements[index]);
			}
			s_element.handle_s_mouse = (s_mouse: S_Mouse): boolean => {
				return handle_s_mouse(s_mouse, index);
			};
			// Only set up autorepeat for buttons, not title
			const isButton = !has_title || index > 0;
			if (isButton) {
				const button_index = has_title ? index - 1 : index;
				// Set up autorepeat for each button (always enabled for next-previous)
				s_element.mouse_detection = T_Mouse_Detection.autorepeat;
				autorepeat_isFirstCall[index] = true;
				s_element.autorepeat_callback = () => {
					if (autorepeat_events[index]) {
						const isFirst = autorepeat_isFirstCall[index];
						autorepeat_isFirstCall[index] = false;
						closure(button_index, autorepeat_events[index], button_elements[index], isFirst);
					}
				};
				s_element.autorepeat_id = index;
			}
		});
		return () => {
			s_elements.forEach(s => hits.delete_hit_target(s));
		};
	});

	$: index_forHover = s_elements.findIndex(s => s.hasSameID_as($w_s_hover));
	$: isAutorepeating = (index: number) => s_elements[index]?.hasSameID_as($w_autorepeat) ?? false;

	function get_path_for(title: string, index: number): string {
		if (!custom_svgPaths) {
			return svgPaths.fat_polygon_path_for(String(title), size);
		} else {
			if (index === 0 && custom_svgPaths.up) {
				return custom_svgPaths.up + ' ' +
				svgPaths.fat_polygon_path_for('up', size);
			}
			if (index === 1 && custom_svgPaths.down) {
				return custom_svgPaths.down + ' ' +
				svgPaths.fat_polygon_path_for('down', size);
			}
		}
		return k.empty;
	}

	function is_using_custom_svgPaths(index: number): boolean {
		if (!custom_svgPaths) return false;
		return (index === 0 && !!custom_svgPaths.up) || (index === 1 && !!custom_svgPaths.down);
	}

	function get_svg_transform(index: number): string {
		const isCustom = is_using_custom_svgPaths(index);
		// Perfect centering for custom icons (+ and -)
		// Small vertical nudge (0.5px down) for triangles for better visual alignment
		return isCustom 
			? 'translate(-50%, -50%)' 
			: 'translate(-50%, calc(-50% + 0.5px))';
	}

	function get_stroke_color(index: number): string {
		// Use colors.default for triangular arrows (like Triangle_Button), colors.border for custom stroke-only icons
		return is_using_custom_svgPaths(index) ? colors.border : colors.default;
	}

	function handle_s_mouse(s_mouse: S_Mouse, index: number): boolean {
		// Only handle buttons, not title (if has_title, index 0 is title)
		const isButton = !has_title || index > 0;
		if (!isButton) return false;
		
		// Map to button index (0 = previous, 1 = next)
		const button_index = has_title ? index - 1 : index;
		
		if (s_mouse.isDown && s_mouse.event) {
			// Capture event for autorepeat callback
			autorepeat_events[index] = s_mouse.event;
			autorepeat_isFirstCall[index] = true;
			// Autorepeat is handled centrally by Hits.ts (callback fires immediately)
		} else if (s_mouse.isUp) {
			autorepeat_events[index] = null;
			autorepeat_isFirstCall[index] = true; // Reset for next press
			// Autorepeat stop is handled centrally by Hits.ts
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
	{#each row_titles as title, index}
		<button class='{name}-{title}-button'
			bind:this={button_elements[index]}
			class:held={isAutorepeating(index)}
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
				style='display: block; position: absolute; top: 50%; left: 50%; transform: {get_svg_transform(index)};'
				viewBox='0 0 {size} {size}'>
				<path
					d={get_path_for(title, index)}
					stroke={get_stroke_color(index)}
					stroke-width={is_using_custom_svgPaths(index) ? '1.5' : '0.75'}
					fill={is_using_custom_svgPaths(index) ? 'white' : (index_forHover === index ? colors.background_special_blend('black', k.opacity.medium) : 'white')}/>
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
