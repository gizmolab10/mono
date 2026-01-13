<script lang='ts'>
	import { e, k, u, x, hits, Point, Thing, T_Layer, colors, signals, elements } from '../../ts/common/Global_Imports';
	import ColorPicker from 'svelte-awesome-color-picker';
	import { get } from 'svelte/store';
	import { onMount } from 'svelte';
	export let origin = Point.zero;
	export let picker_offset = k.empty;
	export let zindex = T_Layer.frontmost;
	export let color = colors.default_forThings;
	export let color_closure = (color: string) => {};
	const selectorSize = k.height.dot + 1;
	const pickerSize = 122;
	let borderColor = colors.separator;

	async function handle_color_change(event) {
		u.consume_event(event);
		const new_color = event.detail.hex;
		if (color != new_color) {
			color_closure(new_color)
			borderColor = colors.separator;
			color = new_color;
		}
	}

</script>

<div class='color'
	style='
		z-index: {zindex};
		top: {origin.y}px;
		left: {origin.x}px;
		position: absolute;
		--picker_offset: {picker_offset};'>
	<ColorPicker
		label=''
		on:input={handle_color_change}
		hex={colors.color_toHex(color)}
		--picker-indicator-size='{selectorSize}px'
		--slider-width='{selectorSize}px'
		--picker-height='{pickerSize}px'
		--cp-border-color={borderColor}
		--picker-width='{pickerSize}px'
		--input-size='{selectorSize}px'
		--picker-z-index='{zindex}'/>
</div>

<style>
	div :global(.component) {
		left: var(--picker_offset);
		top: 24px;
	}

	div :global(.picker-indicator) {
		border-radius: 50%;
	}
</style>
