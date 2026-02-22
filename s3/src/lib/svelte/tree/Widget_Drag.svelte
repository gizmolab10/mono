<script lang='ts'>
	import { onMount, onDestroy }  from 'svelte';
	import type { Ancestry }       from '../../nav/Ancestry';
	import { T_Hit_Target }        from '../../common/Enumerations';
	import { S_Hit_Target }        from '../../state/S_Hit_Target';
	import { hits }                from '../../managers/Hits.svelte';
	import { ux }                  from '../../state/ux.svelte';
	import type { Point }          from '../../types/Coordinates';

	let { ancestry, color, center }: {
		ancestry: Ancestry;
		color   : string;
		center  : Point;
	} = $props();

	const isHovering = $derived(
		hits.hovering?.type === T_Hit_Target.drag &&
		hits.hovering?.ancestry !== null &&
		ancestry.equals(hits.hovering?.ancestry)
	);

	let element: HTMLDivElement;
	let hit_target: S_Hit_Target;

	onMount(() => {
		hit_target = new S_Hit_Target(T_Hit_Target.drag, ancestry);
		hit_target.handle_s_mouse = (s_mouse) => {
			if (s_mouse.isDown) {
				const shiftKey = s_mouse.event?.shiftKey ?? false;
				if (shiftKey) {
					ux.grab(ancestry);
				} else {
					ux.grabOnly(ancestry);
				}
			}
			return true;
		};
		hit_target.set_html_element(element);
		hits.add_hit_target(hit_target);
	});

	onDestroy(() => {
		if (hit_target) hits.delete_hit_target(hit_target);
	});

	const rx     = 4;
	const ry     = 5.5;
	const width  = rx * 2;
	const height = ry * 2;
</script>

<div
	class  = 'drag'
	bind:this  = {element}
	style:left = '{center.x - rx}px'
	style:top  = '{center.y - ry - 3}px'>
	<svg
		width  = {width}
		height = {height}
		viewBox = '0 0 {width} {height}'>
		<ellipse cx={rx} cy={ry} {rx} {ry} fill={isHovering ? color : 'white'} stroke={color} stroke-width='1' />
	</svg>
</div>

<style>
	.drag {
		position : absolute;
	}
</style>
