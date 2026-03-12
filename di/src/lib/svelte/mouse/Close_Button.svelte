<script lang='ts'>
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { svg_paths } from '../../ts/draw/SVG_Paths';
	import { Point } from '../../ts/types/Coordinates';
	import { colors } from '../../ts/draw/Colors';
	import { hits } from '../../ts/managers/Hits';
	const { w_s_hover } = hits;

	const { size = 20, origin, name = 'close-button', onclose }: { size?: number; origin: Point; name?: string; onclose: () => void } = $props();
	const isHovering = $derived($w_s_hover?.id === T_Hit_Target.control + '-' + name);
	const circlePath = $derived(svg_paths.circle_atOffset(size, size - 2));
	const crossPath = $derived(svg_paths.x_cross(size, size / 6));

</script>

<div
	tabindex="0"
	role="button"
	class='close-button'
	style:width="{size}px"
	style:height="{size}px"
	style:top="{origin.y}px"
	style:right="{origin.x}px"
	use:hit_target={{ id: name, onpress: onclose }}>
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<path
			d={circlePath}
			stroke-width="0.75"
			stroke={colors.default}
			fill={isHovering ? 'var(--hover)' : 'white'}
		/>
		<path
			fill="none"
			d={crossPath}
			stroke-width="1"
			stroke={isHovering ? 'white' : colors.default}
		/>
	</svg>
</div>

<style>

	.close-button {
		z-index: var(--z-action);
		position: absolute;
		user-select: none;
		cursor: pointer;
	}

</style>
