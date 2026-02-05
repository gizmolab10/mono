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
		hit_closure
	}: {
		show_up?: boolean;
		show_down?: boolean;
		hit_closure: (pointsUp: boolean, isLong: boolean) => void;
	} = $props();

	const buttonSize = 20;
	let upElement: HTMLElement | null = $state(null);
	let downElement: HTMLElement | null = $state(null);

	const upTarget = new S_Hit_Target(T_Hit_Target.button, 'stepper-up');
	const downTarget = new S_Hit_Target(T_Hit_Target.button, 'stepper-down');

	const upPath = svg_paths.fat_polygon(buttonSize, Direction.up);
	const downPath = svg_paths.fat_polygon(buttonSize, Direction.down);

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

<div class='steppers'>
	{#if show_up}
		<div
			class='stepper-button'
			bind:this={upElement}
			style:top="0px"
			role="button"
			tabindex="0">
			<svg width={buttonSize} height={buttonSize} viewBox="0 0 {buttonSize} {buttonSize}">
				<path
					d={upPath}
					fill={hoverUp ? colors.default : 'white'}
					stroke={colors.default}
					stroke-width="0.75"
				/>
			</svg>
		</div>
	{/if}
	{#if show_down}
		<div
			class='stepper-button'
			bind:this={downElement}
			style:top="{buttonSize}px"
			role="button"
			tabindex="0">
			<svg width={buttonSize} height={buttonSize} viewBox="0 0 {buttonSize} {buttonSize}">
				<path
					d={downPath}
					fill={hoverDown ? colors.default : 'white'}
					stroke={colors.default}
					stroke-width="0.75"
				/>
			</svg>
		</div>
	{/if}
</div>

<style>
	.steppers {
		position: absolute;
		top: 8px;
		left: 8px;
	}
	.stepper-button {
		position: absolute;
		cursor: pointer;
		user-select: none;
	}
</style>
