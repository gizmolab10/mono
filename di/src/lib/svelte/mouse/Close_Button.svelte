<script lang='ts'>
	import { hit_target } from '../../ts/events/Hit_Target';
	import { svg_paths } from '../../ts/draw/SVG_Paths';
	import { colors } from '../../ts/draw/Colors';
	const { w_accent_color } = colors;
	import { Point } from '../../ts/types/Coordinates';
	import { hits } from '../../ts/managers/Hits';

	let { size = 20, origin, name = 'close', onclose }: { size?: number; origin: Point; name?: string; onclose: () => void } = $props();

	const circlePath = $derived(svg_paths.circle_atOffset(size, size - 2));
	const crossPath = $derived(svg_paths.x_cross(size, size / 6));

	const { w_s_hover } = hits;
	const isHovering = $derived($w_s_hover?.id === `button-${name}`);
</script>

<div
	class='close-button'
	use:hit_target={{ id: name, onpress: onclose }}
	style:width="{size}px"
	style:height="{size}px"
	style:top="{origin.y}px"
	style:right="{origin.x}px"
	role="button"
	tabindex="0">
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<path
			d={circlePath}
			fill={isHovering ? $w_accent_color : 'white'}
			stroke={colors.default}
			stroke-width="0.75"
		/>
		<path
			d={crossPath}
			fill="none"
			stroke={isHovering ? 'white' : colors.default}
			stroke-width="1"
		/>
	</svg>
</div>

<style>
	.close-button {
		position: absolute;
		cursor: pointer;
		user-select: none;
		z-index: 10;
	}
</style>
