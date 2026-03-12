<script lang='ts'>
	import { T_Hit_Target, T_Mouse_Detection } from '../../ts/types/Enumerations';
	import S_Hit_Target from '../../ts/state/S_Hit_Target';
	import { svg_paths } from '../../ts/draw/SVG_Paths';
	import { Direction } from '../../ts/types/Angle';
	import { colors } from '../../ts/draw/Colors';
	import { hits } from '../../ts/managers/Hits';
	import S_Mouse from '../../ts/state/S_Mouse';
	import { onMount } from 'svelte';

	let {
		gap = -5,
		size = 20,
		hit_closure,
		show_up = true,
		show_down = true,
		horizontal = false
	}: {
		gap?: number;
		size?: number;
		show_up?: boolean;
		show_down?: boolean;
		horizontal?: boolean;
		hit_closure: (pointsUp: boolean, isLong: boolean) => void;
	} = $props();

	const { w_s_hover } = hits;
	const { w_accent_color } = colors;
	const buttonSize = $derived(size);
	const strokeWidth = $derived(size * 0.0375);
	const uid = Math.random().toString(36).slice(2, 8);
	const direction_A = $derived(horizontal ? Direction.left : Direction.up);
	const direction_B = $derived(horizontal ? Direction.right : Direction.down);
	const target_A = new S_Hit_Target(T_Hit_Target.control, `stepper-${uid}-up`);
	const target_B = new S_Hit_Target(T_Hit_Target.control, `stepper-${uid}-down`);
	const bounds_A = $derived(svg_paths.fat_polygon_bounds(buttonSize, direction_A));
	const bounds_B = $derived(svg_paths.fat_polygon_bounds(buttonSize, direction_B));
	const path_A = $derived(svg_paths.fat_polygon(buttonSize, direction_A));
	const path_B = $derived(svg_paths.fat_polygon(buttonSize, direction_B));
	const hover_A = $derived($w_s_hover?.id === target_A.id);
	const hover_B = $derived($w_s_hover?.id === target_B.id);

	let element_A: HTMLElement | null = $state(null);
	let element_B: HTMLElement | null = $state(null);

	$effect(() => {
		if (element_A) {
			target_A.set_html_element(element_A);
			target_A.mouse_detection = T_Mouse_Detection.autorepeat;
			target_A.autorepeat_callback = () => hit_closure(true, false);
			target_A.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isDown && s_mouse.event?.metaKey) {
					hit_closure(true, true);
				}
				return true;
			};
		}
	});

	$effect(() => {
		if (element_B) {
			target_B.set_html_element(element_B);
			target_B.mouse_detection = T_Mouse_Detection.autorepeat;
			target_B.autorepeat_callback = () => hit_closure(false, false);
			target_B.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isDown && s_mouse.event?.metaKey) {
					hit_closure(false, true);
				}
				return true;
			};
		}
	});

	onMount(() => {
		return () => {
			hits.delete_hit_target(target_A);
			hits.delete_hit_target(target_B);
		};
	});

</script>

<div class='steppers' class:horizontal style:--l-gap="{gap}px">
	<div
		class='stepper-button'
		class:hidden={!show_up}
		bind:this={element_A}
		role="button"
		tabindex="0">
		<svg width={bounds_A.width} height={bounds_A.height} view_Box="{bounds_A.minX} {bounds_A.minY} {bounds_A.width} {bounds_A.height}">
			<path
				d={path_A}
				fill={hover_A ? $w_accent_color : 'white'}
				stroke={colors.default}
				stroke-width={strokeWidth}
			/>
		</svg>
	</div>
	<div
		class='stepper-button'
		class:hidden={!show_down}
		bind:this={element_B}
		role="button"
		tabindex="0">
		<svg width={bounds_B.width} height={bounds_B.height} view_Box="{bounds_B.minX} {bounds_B.minY} {bounds_B.width} {bounds_B.height}">
			<path
				d={path_B}
				stroke={colors.default}
				fill={hover_B ? $w_accent_color : 'white'}
				stroke-width={strokeWidth}
			/>
		</svg>
	</div>
</div>

<style>

	.steppers {
		display        : flex;
		flex-direction : column;
		align-items    : center;
	}

	.steppers.horizontal {
		flex-direction : row;
	}

	.stepper-button {
		cursor     : pointer;
		user-select: none;
	}

	.stepper-button + .stepper-button {
		margin-top : var(--l-gap);
	}

	.horizontal > .stepper-button + .stepper-button {
		margin-top  : 0;
		margin-left : var(--l-gap);
	}

	.stepper-button.hidden {
		visibility : hidden;
	}

</style>
