<script lang='ts'>
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import { svg_paths } from '../../ts/utilities/SVG_Paths';
	import { hit_target } from '../../ts/events/Hit_Target';
	import { colors } from '../../ts/utilities/Colors';
	import { Direction } from '../../ts/types/Angle';
	import { Identifiable } from '../../ts/runtime';
	import { hits } from '../../ts/events/Hits';

	let {
		gap = -5,
		size = 20,
		hit_closure,
		show_up = true,
		show_down = true,
		disable_A = false,
		disable_B = false,
		horizontal = false
	}: {
		gap?: number;
		size?: number;
		show_up?: boolean;
		show_down?: boolean;
		disable_A?: boolean;
		disable_B?: boolean;
		horizontal?: boolean;
		hit_closure: (pointsUp: boolean) => void;
	} = $props();

	const strokeWidth = 0.75;
	const { w_s_hover } = hits;
	const { w_hover_color } = colors;
	const uid = Identifiable.newID();
	const buttonSize = $derived(size);
	const direction_A = $derived(horizontal ? Direction.left : Direction.up);
	const direction_B = $derived(horizontal ? Direction.right : Direction.down);
	const path_A = $derived(svg_paths.fat_polygon(buttonSize, direction_A));
	const path_B = $derived(svg_paths.fat_polygon(buttonSize, direction_B));
	const bounds_A = $derived(svg_paths.fat_polygon_bounds(buttonSize, direction_A));
	const bounds_B = $derived(svg_paths.fat_polygon_bounds(buttonSize, direction_B));
	const hover_A = $derived($w_s_hover?.id === T_Hit_Target.control + '-' + `stepper-${uid}-up`);
	const hover_B = $derived($w_s_hover?.id === T_Hit_Target.control + '-' + `stepper-${uid}-down`);

</script>

<div class='steppers' class:horizontal style:--l-gap="{gap}px">
	<div
		tabindex="0"
		role="button"
		class='stepper-button'
		class:hidden={!show_up}
		class:disabled={disable_A}
		use:hit_target={{ id: `stepper-${uid}-up`, onautorepeat: () => { if (!disable_A) hit_closure(true); } }}>
		<svg overflow='visible' width={bounds_A.width} height={bounds_A.height} viewBox="{bounds_A.minX} {bounds_A.minY} {bounds_A.width} {bounds_A.height}">
			<path
				d={path_A}
				stroke={colors.default}
				stroke-width={strokeWidth}
				fill={hover_A && !disable_A ? $w_hover_color : 'white'}
			/>
		</svg>
	</div>
	<div
		tabindex="0"
		role="button"
		class='stepper-button'
		class:hidden={!show_down}
		class:disabled={disable_B}
		use:hit_target={{ id: `stepper-${uid}-down`, onautorepeat: () => { if (!disable_B) hit_closure(false); } }}>
		<svg overflow='visible' width={bounds_B.width} height={bounds_B.height} viewBox="{bounds_B.minX} {bounds_B.minY} {bounds_B.width} {bounds_B.height}">
			<path
				d={path_B}
				stroke={colors.default}
				stroke-width={strokeWidth}
				fill={hover_B && !disable_B ? $w_hover_color : 'white'}
			/>
		</svg>
	</div>
</div>

<style>

	.steppers {
		overflow       : visible;
		flex-direction : column;
		align-items    : center;
		display        : flex;
	}

	.steppers.horizontal {
		flex-direction : row;
	}

	.stepper-button {
		cursor      : pointer;
		overflow    : visible;
	}

	.stepper-button + .stepper-button {
		margin-top : var(--l-gap);
	}

	.horizontal > .stepper-button + .stepper-button {
		margin-left : var(--l-gap);
		margin-top  : 0;
	}

	.stepper-button.hidden {
		visibility : hidden;
	}

	.stepper-button.disabled {
		cursor  : default;
		opacity : 0.3;
	}

</style>
