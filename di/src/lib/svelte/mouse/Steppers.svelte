<script lang='ts'>
	import S_Hit_Target from '../../ts/state/S_Hit_Target';
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import { svg_paths } from '../../ts/draw/SVG_Paths';
	import { colors } from '../../ts/draw/Colors';
	import { Direction } from '../../ts/types/Angle';
	import { hits } from '../../ts/managers/Hits';
	import S_Mouse from '../../ts/state/S_Mouse';
	import { onMount } from 'svelte';

	let {
		show_up = true,
		show_down = true,
		horizontal = false,
		size = 20,
		gap = -5,
		hit_closure
	}: {
		show_up?: boolean;
		show_down?: boolean;
		horizontal?: boolean;
		size?: number;
		gap?: number;
		hit_closure: (pointsUp: boolean, isLong: boolean) => void;
	} = $props();

	const buttonSize = $derived(size);
	const strokeWidth = $derived(size * 0.0375);
	let elementA: HTMLElement | null = $state(null);
	let elementB: HTMLElement | null = $state(null);

	const uid = Math.random().toString(36).slice(2, 8);
	const targetA = new S_Hit_Target(T_Hit_Target.button, `stepper-${uid}-up`);
	const targetB = new S_Hit_Target(T_Hit_Target.button, `stepper-${uid}-down`);

	const directionA = $derived(horizontal ? Direction.left : Direction.up);
	const directionB = $derived(horizontal ? Direction.right : Direction.down);
	const pathA = $derived(svg_paths.fat_polygon(buttonSize, directionA));
	const pathB = $derived(svg_paths.fat_polygon(buttonSize, directionB));
	const boundsA = $derived(svg_paths.fat_polygon_bounds(buttonSize, directionA));
	const boundsB = $derived(svg_paths.fat_polygon_bounds(buttonSize, directionB));

	$effect(() => {
		if (elementA) {
			targetA.set_html_element(elementA);
			targetA.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isDown) hit_closure(true, s_mouse.event?.metaKey ?? false);
				return true;
			};
		}
	});

	$effect(() => {
		if (elementB) {
			targetB.set_html_element(elementB);
			targetB.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isDown) hit_closure(false, s_mouse.event?.metaKey ?? false);
				return true;
			};
		}
	});

	onMount(() => {
		return () => {
			hits.delete_hit_target(targetA);
			hits.delete_hit_target(targetB);
		};
	});

	const { w_s_hover } = hits;
	const hoverA = $derived($w_s_hover?.id === targetA.id);
	const hoverB = $derived($w_s_hover?.id === targetB.id);
</script>

<div class='steppers' class:horizontal style:--gap="{gap}px">
	<div
		class='stepper-button'
		class:hidden={!show_up}
		bind:this={elementA}
		role="button"
		tabindex="0">
		<svg width={boundsA.width} height={boundsA.height} viewBox="{boundsA.minX} {boundsA.minY} {boundsA.width} {boundsA.height}">
			<path
				d={pathA}
				fill={hoverA ? colors.default : 'white'}
				stroke={colors.default}
				stroke-width={strokeWidth}
			/>
		</svg>
	</div>
	<div
		class='stepper-button'
		class:hidden={!show_down}
		bind:this={elementB}
		role="button"
		tabindex="0">
		<svg width={boundsB.width} height={boundsB.height} viewBox="{boundsB.minX} {boundsB.minY} {boundsB.width} {boundsB.height}">
			<path
				d={pathB}
				fill={hoverB ? colors.default : 'white'}
				stroke={colors.default}
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
		margin-top : var(--gap);
	}
	.horizontal > .stepper-button + .stepper-button {
		margin-top  : 0;
		margin-left : var(--gap);
	}
	.stepper-button.hidden {
		visibility : hidden;
	}
</style>
