<script lang='ts'>
	import S_Hit_Target from '../../ts/state/S_Hit_Target';
	import { T_Hit_Target } from '../../ts/types/Enumerations';
	import { svg_paths } from '../../ts/draw/SVG_Paths';
	import { colors } from '../../ts/draw/Colors';
	import { Point } from '../../ts/types/Coordinates';
	import { hits } from '../../ts/managers/Hits';
	import S_Mouse from '../../ts/state/S_Mouse';
	import { onMount } from 'svelte';

	let { size = 20, origin, name = 'close', onclose }: { size?: number; origin: Point; name?: string; onclose: () => void } = $props();

	let element: HTMLElement | null = $state(null);
	const target = $derived(new S_Hit_Target(T_Hit_Target.button, name));

	const circlePath = $derived(svg_paths.circle_atOffset(size, size - 2));
	const crossPath = $derived(svg_paths.x_cross(size, size / 6));

	$effect(() => {
		if (element) {
			target.set_html_element(element);
			target.handle_s_mouse = (s_mouse: S_Mouse) => {
				if (s_mouse.isDown) onclose();
				return true;
			};
		}
	});

	onMount(() => {
		return () => {
			hits.delete_hit_target(target);
		};
	});

	const { w_s_hover } = hits;
	const isHovering = $derived($w_s_hover?.id === target.id);
</script>

<div
	class='close-button'
	bind:this={element}
	style:width="{size}px"
	style:height="{size}px"
	style:top="{origin.y}px"
	style:right="{origin.x}px"
	role="button"
	tabindex="0">
	<svg width={size} height={size} viewBox="0 0 {size} {size}">
		<path
			d={circlePath}
			fill={isHovering ? 'gray' : 'white'}
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
