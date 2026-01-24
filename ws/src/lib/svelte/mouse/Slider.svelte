<script lang='ts'>
	import { e, g, hits, Point, elements, T_Hit_Target, colors } from '../../ts/common/Global_Imports';
	import Identifiable from '../../ts/runtime/Identifiable';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	export let handle_value_change: (value: number) => void = () => {};
	export let thumb_color: string = '#007aff';
	export let isLogarithmic: boolean = false;
	export let title_font_size: number = 18;
	export let show_value: boolean = true;
	export let origin: Point = Point.zero;
	export let isVisible: boolean = true;
	export let divisions: number = 100;
	export let name: string = 'slider';
	export let height: number = 22;
	export let width: number = 200;
	export let value: number = 1;
	export let max: number = 20;
	const { w_s_hover } = hits;
	const { w_mouse_button_down } = e;
	const border = '1px solid darkgray';
	const { w_background_color } = colors;
	const x = isLogarithmic ? Math.log10(max) / divisions : max / divisions;
	const s_element = elements.s_element_for(new Identifiable(name), T_Hit_Target.control, 'slider');
	let slider_value = value <= 1 ? 0 : (isLogarithmic ? Math.log10(value) / x : value / x);
	let slider_input: HTMLInputElement | null = null;
	let current_thumb_color = thumb_color;
	let prior_value = value;
	let is_dragging_this_slider = false;
	
	onMount(() => {
		if (slider_input) {
			s_element.set_html_element(slider_input);
			s_element.contains_point = thumb_contains_point;
			s_element.handle_s_mouse = (s_mouse) => {
				if (s_mouse.isDown) {
					is_dragging_this_slider = true;
				} else if (s_mouse.isUp) {
					is_dragging_this_slider = false;
				}
				return false;
			};
		}
		return () => {
			hits.delete_hit_target(s_element);
		};
	});

	$: slider_value, compute_andPush();
	
	$: if (slider_input && s_element.contains_point) {
		s_element.contains_point = thumb_contains_point;
	}
	
	$: {
		const _ = `${$w_s_hover?.id}:::${is_dragging_this_slider}`;
		const isHovering = s_element.isHovering;
		if (isHovering || is_dragging_this_slider) {
			current_thumb_color = colors.background_special_blend('gray', 0.5) ?? thumb_color;
		} else {
			current_thumb_color = thumb_color;
		}
	}

	function compute_andPush() {
		const new_value = isLogarithmic ? Math.round(Math.pow(10, slider_value * x)) : Math.round(slider_value * x);
		if (new_value !== prior_value) {
			prior_value = value = new_value;
			handle_value_change(value);
		}
	}
	
	function thumb_contains_point(point: Point | null): boolean {
		const rect = g.scaled_rect_forElement(slider_input);
		if (!rect || !point || !slider_input) return false;
		const thumb_x = rect.origin.x + (slider_value / divisions) * rect.size.width;
		const thumb_radius = height / (2 * get(g.w_scale_factor));
		const thumb_y = rect.origin.y + rect.size.height / 2;
		const dx = point.x - thumb_x;
		const dy = point.y - thumb_y;
		return Math.sqrt(dx * dx + dy * dy) <= thumb_radius;
	}
	
</script>

<div class='slider'
	style='
		top: {origin.y}px;
		left: {origin.x}px;
		height: {height}px;
		position: relative;'>
	<div class='slider-border' style='
		width: {width}px;
		position: relative;
		--border: {border};
		align-items: center;
		--height: {height}px;
		--thumb-color: {current_thumb_color};
		display: {isVisible ? 'flex' : 'none'};'>
		<input class='slider-input'
			min='0'
			step='1'
			type='range'
			max={divisions}
			bind:this={slider_input}
			bind:value={slider_value}
			style='flex: 1 1 auto; position: relative; min-width: 0; pointer-events: auto;'/>
		{#if show_value}
			<span style='font-size: {title_font_size}px; margin-left: -26px; display: inline-block; width: 3.5em; text-align: right;'>
				{value}
			</span>
		{/if}
	</div>
</div>

<style>
	input[type='range'] {
		appearance: none;
		height: var(--height);
		background: transparent;
		-webkit-appearance: none;
	}
	input[type='range']::-webkit-slider-runnable-track {
		background: white;
		border-radius: 16px;
		height: var(--height);
		border: var(--border);
	}
	input[type='range']::-webkit-slider-thumb {
		border-radius: 50%;
		margin-top: -1.1px;
		width: var(--height);
		height: var(--height);
		border: var(--border);
		-webkit-appearance: none;
		background: var(--thumb-color);
	}
	input[type='range']::-moz-range-thumb {
		border-radius: 50%;
		width: var(--height);
		height: var(--height);
		border: var(--border);
		background: var(--thumb-color);
	}
	input[type='range']::-moz-range-track {
		background: white;
		border-radius: 50%;
		height: var(--height);
		border: var(--border);
	}
	input[type='range']::-ms-fill-lower,
	input[type='range']::-ms-fill-upper {
		background: white;
		border-radius: 50%;
		border: var(--border);
	}
	input[type='range']::-ms-thumb {
		border-radius: 50%;
		width: var(--height);
		height: var(--height);
		border: var(--border);
		background: var(--thumb-color);
	}
	input[type='range']:focus {
		outline: none;
	}
</style>
