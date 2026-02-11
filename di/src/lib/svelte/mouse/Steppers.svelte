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
		hit_closure
	}: {
		show_up?: boolean;
		show_down?: boolean;
		horizontal?: boolean;
		size?: number;
		hit_closure: (pointsUp: boolean, isLong: boolean) => void;
	} = $props();

	const buttonSize = $derived(size);
	const strokeWidth = $derived(size * 0.0375);
	let upElement: HTMLElement | null = $state(null);
	let downElement: HTMLElement | null = $state(null);

	const upTarget = new S_Hit_Target(T_Hit_Target.button, 'stepper-up');
	const downTarget = new S_Hit_Target(T_Hit_Target.button, 'stepper-down');

	const firstPath = $derived(svg_paths.fat_polygon(buttonSize, horizontal ? Direction.left : Direction.up));
	const secondPath = $derived(svg_paths.fat_polygon(buttonSize, horizontal ? Direction.right : Direction.down));

	$effect(() => {
		if (upElement) {
			upTarget.set_html_element(upElement);
			upTarget.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isDown) hit_closure(true, s_mouse.event?.metaKey ?? false);
				return true;
			};
		}
	});

	$effect(() => {
		if (downElement) {
			downTarget.set_html_element(downElement);
			downTarget.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isDown) hit_closure(false, s_mouse.event?.metaKey ?? false);
				return true;
			};
		}
	});

	onMount(() => {
		return () => {
			hits.delete_hit_target(upTarget);
			hits.delete_hit_target(downTarget);
		};
	});

	const { w_s_hover } = hits;
	const hoverUp = $derived($w_s_hover?.id === upTarget.id);
	const hoverDown = $derived($w_s_hover?.id === downTarget.id);
</script>

<div class='steppers' class:horizontal>
	{#if show_up}
		<div
			class='stepper-button'
			bind:this={upElement}
			role="button"
			tabindex="0">
			<svg width={buttonSize} height={buttonSize} viewBox="0 0 {buttonSize} {buttonSize}">
				<path
					d={firstPath}
					fill={hoverUp ? colors.default : 'white'}
					stroke={colors.default}
					stroke-width={strokeWidth}
				/>
			</svg>
		</div>
	{/if}
	{#if show_down}
		<div
			class='stepper-button'
			bind:this={downElement}
			role="button"
			tabindex="0">
			<svg width={buttonSize} height={buttonSize} viewBox="0 0 {buttonSize} {buttonSize}">
				<path
					d={secondPath}
					fill={hoverDown ? colors.default : 'white'}
					stroke={colors.default}
					stroke-width={strokeWidth}
				/>
			</svg>
		</div>
	{/if}
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
		margin-top : -4px;
	}
	.horizontal > .stepper-button + .stepper-button {
		margin-top  : 0;
		margin-left : -4px;
	}
</style>
